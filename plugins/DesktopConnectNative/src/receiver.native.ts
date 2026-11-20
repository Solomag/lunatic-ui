import { getResponder, type CiaoService, type Responder } from "@homebridge/ciao";
import { createHash } from "crypto";
import { app, webContents } from "electron";
import { readFile } from "fs/promises";
import { hostname, networkInterfaces } from "os";
import path from "path";

import { ConnectReceiver, type PlayerCommand, type PlayerEvent } from "./connect/ConnectReceiver";
// TIDAL's desktop server certificate, public. The phone only trusts it (signed by TIDAL's CA)
import tidalCert from "file://./connect/tidal_server_cert.pem";

// The mDNS responder is this module's own (luna bundles ciao into it, a reload gets a new one), it is shut down with the receiver
type Running = { receiver: ConnectReceiver; responder: Responder; service?: CiaoService; watchAddresses?: NodeJS.Timeout };
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

// Not TIDAL's own device id (its receiver may be advertised too), stable so the phone remembers the device
const deviceId = () => createHash("md5").update(`TidaLuna:${hostname()}`).digest("hex");

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

// The phone connects to port 9000 whatever port the mDNS record says (Lunar uses 9000 too)
const connectPort = 9000;
const lanAddresses = () =>
	Object.values(networkInterfaces())
		.flat()
		.filter((info) => info !== undefined && info.family === "IPv4" && !info.internal)
		.map((info) => info!.address);

// A new network (Wi-Fi, VPN, another address) is listened on within this time
const addressCheckMs = 10_000;

// Port 9000 may be held on all addresses by another receiver: TIDAL's own (tidal_connect_application, started with every
// window) or TidaLunar's. Windows gives a connection to the socket bound to its exact address before one bound to all
// addresses, so the receiver listens on each network address (and loopback): the phone's connections come here.
// Listening on all addresses instead may succeed next to the other receiver (IPv6 dual stack next to its IPv4) and get nothing.
// The addresses change with the network, they are checked again every few seconds
const listenHosts = () => [...lanAddresses(), "127.0.0.1"];
const listen = async (cert: string | Buffer, key: string | Buffer) => {
	const receiver = await ConnectReceiver.start({ cert, key, port: connectPort, toPlayer, log, hosts: listenHosts() });
	if (!receiver.listening) log(`Cannot listen on port ${connectPort} on any network address yet, phones will not find the receiver`);
	const watchAddresses = setInterval(() => receiver.setHosts(listenHosts()).catch(log), addressCheckMs);
	return { receiver, watchAddresses };
};

// Starts the own receiver, undefined without a key
export const startReceiver = (builtInKeyBase64: string) => oneAtATime(() => start(builtInKeyBase64));
const start = async (builtInKeyBase64: string): Promise<{ port: number } | undefined> => {
	if (running.__desktopConnectNativeReceiver) return { port: running.__desktopConnectNativeReceiver.receiver.port };
	const keys = await loadKeys(builtInKeyBase64);
	if (keys === undefined) return undefined;
	const { cert, key } = keys;
	const { receiver, watchAddresses } = await listen(cert, key);
	// Kept at once, so a failed advertise below still stops the receiver
	const current: Running = { receiver, responder: getResponder(), watchAddresses };
	running.__desktopConnectNativeReceiver = current;
	try {
		await advertise(current);
	} catch (err) {
		await stop();
		throw err;
	}
	log("Listening on port", receiver.port);
	return { port: receiver.port };
};

const advertise = async (current: Running) => {
	const id = deviceId();
	current.service = current.responder.createService({
		disabledIpv6: true,
		port: current.receiver.port,
		type: "tidalconnect",
		name: `TidalConnect-${id.slice(0, 8)}`,
		txt: {
			mn: "TidaLuna",
			id,
			fn: `TidaLuna: ${hostname().split(".")[0]}`,
			ca: "0",
			ve: "1",
		},
	});
	await current.service.advertise();
};

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
