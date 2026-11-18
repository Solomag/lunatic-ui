// The part of Electron's main-process API this plugin uses. Electron itself is provided by TIDAL at
// runtime; installing the electron package only for its types would download a whole Electron build.
declare module "electron" {
	interface WebContents {
		send(channel: string, ...args: unknown[]): void;
		executeJavaScript(code: string, userGesture?: boolean): Promise<any>;
	}
	export class BrowserWindow {
		static fromId(id: number): BrowserWindow | null;
		static getAllWindows(): BrowserWindow[];
		isDestroyed(): boolean;
		webContents: WebContents;
	}
}
