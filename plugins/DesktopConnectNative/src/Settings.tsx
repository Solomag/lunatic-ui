import { ReactiveStore } from "@luna/core";
import { LunaNumberSetting, LunaSettings, LunaTextSetting } from "@luna/ui";
import React from "react";

import { setDeviceName } from "./receiver.native";

export const settings = await ReactiveStore.getPluginStorage("DesktopConnectNative", {
	// Empty: "TidaLuna: <computer name>"
	deviceName: "",
	firstPort: 9000,
});

// Announced once typing stops, not on every key
const announceAfterMs = 1000;
let announceTimer: number | undefined;
const announceName = () => {
	clearTimeout(announceTimer);
	announceTimer = window.setTimeout(() => setDeviceName(settings.deviceName).catch(console.error), announceAfterMs);
};

export const Settings = () => {
	const [deviceName, setName] = React.useState(settings.deviceName);
	const [firstPort, setFirstPort] = React.useState(settings.firstPort);
	return (
		<LunaSettings>
			<LunaTextSetting
				title="Device name"
				desc="The name the phone shows. Empty: TidaLuna and the computer's name"
				value={deviceName}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					setName((settings.deviceName = e.target.value));
					announceName();
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
		</LunaSettings>
	);
};
