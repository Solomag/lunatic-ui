import { getResponder, type CiaoService, type Responder } from "@homebridge/ciao";
import { createHash } from "crypto";
import { app, webContents } from "electron";
import { readFile } from "fs/promises";
import { createServer } from "net";
import { hostname, networkInterfaces } from "os";
import path from "path";

import { addressFilter, parseAddresses } from "./connect/allowedAddresses";
import { ConnectReceiver, type PlayerCommand, type PlayerEvent, type ServiceInfo } from "./connect/ConnectReceiver";
// TIDAL's desktop server certificate, public. The phone only trusts it (signed by TIDAL's CA)
import tidalCert from "file://./connect/tidal_server_cert.pem";

// The mDNS responder is this module's own (luna bundles ciao into it, a reload gets a new one), it is shut down with the receiver
type Running = { receiver: ConnectReceiver; responder: Responder; service?: CiaoService; watchAddresses?: NodeJS.Timeout; deviceName?: string; access: Access };
// Replaced when the user changes the allowed addresses, also for the receiver already running
type Access = { allows: (address: string | undefined) => boolean };
declare const luna: { __desktopConnectNativeReceiver?: Running; __desktopConnectNativeChange?: Promise<unknown> };

const receiverChannel = "desktopConnectNative.receiver";

// A certificate and key in this folder replace the built-in ones (development, tests)
export const keyFolder = () => path.join(app.getPath("userData"), "DesktopConnectNative");
const certFile = "tidal_server_cert.pem";
const keyFile = "tidal_server_key.pem";

// Luna evaluates the native module again (in a new sandbox) when the plugin reloads, so the running receiver is kept on luna,
// otherwise the next stopReceiver would not find it and it would hold the port
const running = luna;

// A stop while the receiver starts (the plugin unloaded quickly) runs after the start, and a start after a stop, also across reloads
const oneAtATime = <T>(change: () => Promise<T>): Promise<T> => {
	const result = (running.__desktopConnectNativeChange ?? Promise.resolve()).catch(() => {}).then(change);
	running.__desktopConnectNativeChange = result;
	return result;
};

// TIDAL's page (luna.tidalWindow is not set in the main process)
const toPlayer = (command: PlayerCommand) => {
	for (const contents of webContents.getAllWebContents()) {
		if (contents.getURL().startsWith("https://desktop.tidal.com/")) contents.send(receiverChannel, command);
	}
};
const log = (...args: unknown[]) => console.log("[DesktopConnectNative]", ...args);

// Not TIDAL's own device id (its receiver may be advertised too), stable so the phone remembers the device.
// Each TIDAL profile on the computer is a device of its own (the phone tells devices apart by it)
const deviceId = () => createHash("md5").update(`TidaLuna:${hostname()}:${app.getPath("userData")}`).digest("hex");

// The certificate and key from the key folder, otherwise TIDAL's certificate with the key the plugin was built with
const loadKeys = async (builtInKeyBase64: string) => {
	const folder = keyFolder();
	const [cert, key] = await Promise.all([readFile(path.join(folder, certFile)), readFile(path.join(folder, keyFile))]).catch(() => []);
	if (cert !== undefined && key !== undefined) {
		log(`Using ${certFile} and ${keyFile} from ${folder}`);
		return { cert, key };
	}
	if (builtInKeyBase64 !== "") return { cert: tidalCert, key: Buffer.from(builtInKeyBase64, "base64") };
	log(`Built without TIDAL's server key and no ${certFile} and ${keyFile} in ${folder}, the own receiver is off`);
	return undefined;
};

// The phone connects to the port in the mDNS record (checked with TIDAL Android 2026-11). 9000 is TIDAL's own receiver's
// and TidaLunar's: the receiver takes the first port from the user's that no one listens on, so they run side by side
const portsTried = 20;
const isFree = (port: number, host: string) =>
	new Promise<boolean>((resolve) => {
		const probe = createServer();
		probe.once("error", () => resolve(false));
		probe.listen(port, host, () => probe.close(() => resolve(true)));
	});
const freePort = async (setting: number) => {
	const firstPort = Number.isInteger(setting) && setting >= 1 && setting <= 65535 ? setting : 9000;
	for (let port = firstPort; port < firstPort + portsTried && port <= 65535; port++) {
		const hosts = ["0.0.0.0", ...listenHosts()];
		const free = await Promise.all(hosts.map((host) => isFree(port, host)));
		if (free.every(Boolean)) return port;
	}
	log(`No free port from ${firstPort} to ${firstPort + portsTried - 1}, trying ${firstPort}`);
	return firstPort;
};

const defaultDeviceName = () => `TidaLuna: ${hostname().split(".")[0]}`;
const lanAddresses = () =>
	Object.values(networkInterfaces())
		.flat()
		.filter((info) => info !== undefined && info.family === "IPv4" && !info.internal)
		.map((info) => info!.address);

// A new network (Wi-Fi, VPN, another address) is listened on within this time
const addressCheckMs = 10_000;

// The receiver listens on each network address (and loopback): when another receiver takes its port on all addresses
// later, Windows still gives a connection to the socket bound to its exact address. Listening on all addresses instead
// may succeed next to another receiver (IPv6 dual stack next to its IPv4) and get nothing.
// The addresses change with the network, they are checked again every few seconds
const listenHosts = () => [...lanAddresses(), "127.0.0.1"];
const listen = async (cert: string | Buffer, key: string | Buffer, firstPort: number, access: Access) => {
	const port = await freePort(firstPort);
	const receiver = await ConnectReceiver.start({ cert, key, port, toPlayer, log, hosts: listenHosts(), serviceInfo, isAllowedAddress: (address) => access.allows(address) });
	if (!receiver.listening) log(`Cannot listen on port ${port} on any network address yet, phones will not find the receiver`);
	const watchAddresses = setInterval(() => receiver.setHosts(listenHosts()).catch(log), addressCheckMs);
	return { receiver, watchAddresses };
};

// Starts the own receiver, undefined without a key
export type ReceiverSettings = { firstPort: number; deviceName: string; allowedAddresses: string; allowAnyAddress: boolean };
export const startReceiver = (builtInKeyBase64: string, settings: ReceiverSettings) => oneAtATime(() => start(builtInKeyBase64, settings));
const start = async (builtInKeyBase64: string, { firstPort, deviceName, allowedAddresses, allowAnyAddress }: ReceiverSettings): Promise<{ port: number } | undefined> => {
	if (running.__desktopConnectNativeReceiver) return { port: running.__desktopConnectNativeReceiver.receiver.port };
	const keys = await loadKeys(builtInKeyBase64);
	if (keys === undefined) return undefined;
	const { cert, key } = keys;
	const access: Access = { allows: addressFilter(allowedAddresses, allowAnyAddress) };
	const { receiver, watchAddresses } = await listen(cert, key, firstPort, access);
	// Kept at once, so a failed advertise below still stops the receiver
	const current: Running = { receiver, responder: getResponder(), watchAddresses, access };
	running.__desktopConnectNativeReceiver = current;
	try {
		await advertise(current, deviceName);
	} catch (err) {
		await stop();
		throw err;
	}
	log("Listening on port", receiver.port);
	return { port: receiver.port };
};

// The name the phone shows, the id stays: the phone keeps it as the same device
const deviceTxt = (deviceName: string) => {
	const id = deviceId();
	return { mn: "TidaLuna", id, fn: deviceName.trim() === "" ? defaultDeviceName() : deviceName.trim(), ca: "0", ve: "1" };
};
const advertise = async (current: Running, deviceName: string) => {
	current.deviceName = deviceName;
	current.service = current.responder.createService({
		disabledIpv6: true,
		port: current.receiver.port,
		type: "tidalconnect",
		name: `TidalConnect-${deviceId().slice(0, 8)}`,
		txt: deviceTxt(deviceName),
	});
	await current.service.advertise();
};

// The record as announced (ciao renames the service on a name conflict), for a phone mDNS does not reach
const serviceInfo = (): ServiceInfo | undefined => {
	const current = running.__desktopConnectNativeReceiver;
	if (current?.service === undefined) return undefined;
	// "<name>.<type PTR>"
	const fqdn = current.service.getFQDN();
	const name = fqdn.slice(0, fqdn.length - current.service.getTypePTR().length - 1);
	return { name, type: "_tidalconnect._tcp", port: current.receiver.port, txt: deviceTxt(current.deviceName ?? "") };
};

// Announced at once, after a start that is still running
export const setDeviceName = (deviceName: string) =>
	oneAtATime(async () => {
		const current = running.__desktopConnectNativeReceiver;
		if (current === undefined) return;
		current.deviceName = deviceName;
		current.service?.updateTxt(deviceTxt(deviceName));
	});

// Applies to new connections at once (connected phones stay), returns the entries not understood
export const setAllowedAddresses = (allowedAddresses: string, allowAnyAddress: boolean) =>
	oneAtATime(async () => {
		const current = running.__desktopConnectNativeReceiver;
		if (current !== undefined) current.access.allows = addressFilter(allowedAddresses, allowAnyAddress);
		return parseAddresses(allowedAddresses).invalid;
	});

export const stopReceiver = () => oneAtATime(stop);
const stop = async () => {
	const current = running.__desktopConnectNativeReceiver;
	if (current === undefined) return;
	running.__desktopConnectNativeReceiver = undefined;
	clearInterval(current.watchAddresses);
	await current.service?.end().catch(log);
	await current.service?.destroy().catch(log);
	await current.responder.shutdown().catch(log);
	await current.receiver.stop();
};

export const playerEvent = (event: PlayerEvent) => running.__desktopConnectNativeReceiver?.receiver.onPlayerEvent(event);
