import { LunaSettings, LunaTrashButton } from "@luna/ui";
import React from "react";

import { resetCover, storage } from "./covers";

export const Settings = () => {
	const [covers, setCovers] = React.useState(() => Object.entries(storage.covers));
	return (
		<LunaSettings>
			{covers.length === 0 && <div>No custom covers yet. Right click an album or playlist and choose "Set custom cover…".</div>}
			{covers.map(([key, cover]) => (
				<div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<img
						src={cover.url}
						style={{
							width: 48,
							height: 48,
							objectFit: "cover",
							borderRadius: 4,
						}}
					/>
					<span style={{ flexGrow: 1 }}>
						{cover.title} <small style={{ opacity: 0.6 }}>({key.split(":")[0]})</small>
					</span>
					<LunaTrashButton
						title="Reset cover"
						onClick={() => {
							resetCover(key);
							setCovers(Object.entries(storage.covers));
						}}
					/>
				</div>
			))}
		</LunaSettings>
	);
};
