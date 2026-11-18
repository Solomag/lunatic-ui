import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting, LunaTextSetting } from "@luna/ui";
import React from "react";

export const settings = await ReactiveStore.getPluginStorage("RemoteApi", {
	port: 24123,
	/** Listen on all network interfaces instead of 127.0.0.1 only */
	allowLan: false,
	/** When set, every request must send it: `Authorization: Bearer <token>` or `?token=<token>` */
	token: "",
});

const validPort = (port: number) => Number.isInteger(port) && port >= 1 && port <= 65535;

export const Settings = () => {
	const [port, setPort] = React.useState(String(settings.port));
	const [allowLan, setAllowLan] = React.useState(settings.allowLan);
	const [token, setToken] = React.useState(settings.token);
	return (
		<LunaSettings>
			<LunaTextSetting
				title="Port"
				desc="The port the API listens on (default 24123)"
				value={port}
				type="number"
				onChange={(e) => {
					setPort(e.target.value);
					const next = Number(e.target.value);
					if (validPort(next)) settings.port = next;
				}}
			/>
			<LunaSwitchSetting
				title="Allow other devices on the network"
				desc="Off: only apps on this computer can use the API. On: any device on your network can, so set a token too."
				checked={allowLan}
				onChange={(_, checked: boolean) => setAllowLan((settings.allowLan = checked))}
			/>
			<LunaTextSetting
				title="Token"
				desc="Optional. When set, requests must send it as 'Authorization: Bearer <token>' or '?token=<token>'. Web pages in a browser can only use the API when a token is set."
				value={token}
				onChange={(e) => setToken((settings.token = e.target.value.trim()))}
			/>
		</LunaSettings>
	);
};
