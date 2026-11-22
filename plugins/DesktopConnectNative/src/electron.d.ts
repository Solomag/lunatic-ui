// The part of Electron's main-process API this plugin uses. Electron itself is provided by TIDAL at runtime
declare module "electron" {
	interface WebContents {
		getURL(): string;
		isDestroyed(): boolean;
		send(channel: string, ...args: unknown[]): void;
	}
	export const app: { getPath(name: "userData"): string };
	export const webContents: { getAllWebContents(): WebContents[] };
}
