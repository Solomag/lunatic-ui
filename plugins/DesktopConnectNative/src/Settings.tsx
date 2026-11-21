import { ReactiveStore } from "@luna/core";
import { redux } from "@luna/lib";
import { LunaNumberSetting, LunaSettings, LunaSwitchSetting, LunaTextSetting } from "@luna/ui";
import React from "react";

import { refusedAccounts, setAllowedAccounts, setAllowedAddresses, setDeviceName } from "./receiver.native";

export const settings = await ReactiveStore.getPluginStorage("DesktopConnectNative", {
	// Empty: "TidaLuna: <computer name>"
	deviceName: "",
	firstPort: 9000,
	// Besides the home network, the computer and Tailscale: addresses and ranges, "203.0.113.5, 198.51.100.0/24"
	allowedAddresses: "",
	allowAnyAddress: false,
	// Besides the account signed in here: TIDAL user ids, "123456, 234567"
	otherAccounts: "",
	anyAccount: false,
});

// The TIDAL account signed in to this TIDAL ("" when none)
export const computerAccount = () => {
	const userId = redux.store.getState().session?.userId;
	return userId ? String(userId) : "";
};
export const allowedAccountIds = () => [computerAccount(), ...settings.otherAccounts.split(/[\s,;]+/)].filter((id) => /^\d+$/.test(id));
// Phones that connect from now on are checked against these
export const applyAccounts = () => setAllowedAccounts(allowedAccountIds(), settings.anyAccount);

// Applied once typing stops, not on every key
const applyAfterMs = 1000;
const debounced = () => {
	let timer: number | undefined;
	return (apply: () => void) => {
		clearTimeout(timer);
		timer = window.setTimeout(apply, applyAfterMs);
	};
};
const afterNameTyped = debounced();
const afterAddressesTyped = debounced();
const afterAccountsTyped = debounced();

const allowedAddressesDesc =
	"Who else may connect besides the home network, this computer and Tailscale: addresses or ranges, like 203.0.113.5, 198.51.100.0/24. " +
	"Only add the networks you need (a port forwarded from the internet)";

export const Settings = () => {
	const [deviceName, setName] = React.useState(settings.deviceName);
	const [firstPort, setFirstPort] = React.useState(settings.firstPort);
	const [allowedAddresses, setAddresses] = React.useState(settings.allowedAddresses);
	const [allowAnyAddress, setAllowAny] = React.useState(settings.allowAnyAddress);
	const [invalid, setInvalid] = React.useState<string[]>([]);
	const [otherAccounts, setOtherAccounts] = React.useState(settings.otherAccounts);
	const [anyAccount, setAnyAccount] = React.useState(settings.anyAccount);
	const [refused, setRefused] = React.useState<string[]>([]);
	React.useEffect(() => void refusedAccounts().then(setRefused).catch(console.error), []);
	const applyAddresses = () =>
		setAllowedAddresses(settings.allowedAddresses, settings.allowAnyAddress).then(setInvalid).catch(console.error);
	React.useEffect(() => void applyAddresses(), []);
	return (
		<LunaSettings>
			<LunaTextSetting
				title="Device name"
				desc="The name the phone shows. Empty: TidaLuna and the computer's name"
				value={deviceName}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					setName((settings.deviceName = e.target.value));
					afterNameTyped(() => setDeviceName(settings.deviceName).catch(console.error));
				}}
			/>
			<LunaNumberSetting
				title="Port"
				desc="The receiver takes the first free port from this one (TIDAL's own receiver and TidaLunar use 9000). The firewall must let the phone in on it. Takes effect when the plugin or TIDAL starts again"
				value={firstPort}
				min={1024}
				max={65535}
				onNumber={(num: number) => setFirstPort((settings.firstPort = num))}
			/>
			<LunaTextSetting
				title="Allowed addresses"
				desc={invalid.length === 0 ? allowedAddressesDesc : `Not understood, left out: ${invalid.join(", ")}`}
				value={allowedAddresses}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					setAddresses((settings.allowedAddresses = e.target.value));
					afterAddressesTyped(applyAddresses);
				}}
			/>
			<LunaSwitchSetting
				title="Allow any address"
				desc="Lets a connection from any address in. Only on a network you trust"
				checked={allowAnyAddress}
				onChange={(_: unknown, checked: boolean) => {
					setAllowAny((settings.allowAnyAddress = checked));
					applyAddresses();
				}}
			/>
			<LunaTextSetting
				title="Other TIDAL accounts"
				desc={
					`Only phones signed in to this computer's TIDAL account (${computerAccount() || "none signed in"}) can use the receiver, and to the accounts here: TIDAL user ids, like 123456, 234567.` +
					(refused.length === 0 ? "" : ` Refused since TIDAL started: ${refused.join(", ")}`)
				}
				value={otherAccounts}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					setOtherAccounts((settings.otherAccounts = e.target.value));
					afterAccountsTyped(() => applyAccounts().catch(console.error));
				}}
			/>
			<LunaSwitchSetting
				title="Any TIDAL account"
				desc="Lets a phone signed in to any TIDAL account control the player"
				checked={anyAccount}
				onChange={(_: unknown, checked: boolean) => {
					setAnyAccount((settings.anyAccount = checked));
					applyAccounts().catch(console.error);
				}}
			/>
		</LunaSettings>
	);
};
