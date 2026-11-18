// Based on @vmohammad/api by vMohammad (https://github.com/vMohammad24/luna-plugins), see THIRD_PARTY_NOTICES.md
import { createHash, timingSafeEqual } from "crypto";
import { BrowserWindow } from "electron";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { WebSocket, WebSocketServer } from "ws";
import type { ActionResult, ActionSchema, WsMessage, WsSubscription } from "./types";

export type ServerOptions = { port: number; host: string; token: string };

type NativeActionHandler = (data: WsMessage) => ActionResult;

const ipcChannel = "remoteApi.playback.control";
const maxBodySize = 64 * 1024;

const schemas: Record<string, ActionSchema> = {
	setRepeatMode: {
		param: "mode",
		validate: (v): v is number => typeof v === "number",
	},
	setShuffleMode: {
		param: "shuffle",
		validate: (v): v is boolean => typeof v === "boolean",
	},
	seek: {
		param: "time",
		validate: (v): v is number => typeof v === "number",
	},
	volume: {
		param: "volume",
		validate: (v): v is string | number => (typeof v === "string" && /^[-+]\d+$/.test(v)) || (typeof v === "number" && v >= 0 && v <= 100),
	},
	playNext: {
		param: "itemId",
		validate: (v): v is string => typeof v === "string" && v.length > 0,
	},
	addToQueue: {
		param: "itemId",
		validate: (v): v is string => typeof v === "string" && v.length > 0,
	},
};

let server: Server | null = null;
let wss: WebSocketServer | null = null;
let token = "";
const fields: Record<string, unknown> = {};
const wsSubscriptions = new Map<WebSocket, WsSubscription>();

const tidalWindow = () => BrowserWindow.fromId(1) ?? BrowserWindow.getAllWindows().find((w) => !w.isDestroyed()) ?? null;

const sendToRenderer = (data: Record<string, unknown>) => {
	const win = tidalWindow();
	if (!win) return console.warn("[Remote API] sendToRenderer: no TIDAL window");
	win.webContents.send(ipcChannel, data);
};

const invokeRenderer = async (data: Record<string, unknown>): Promise<{ success: boolean; response?: unknown }> => {
	const win = tidalWindow();
	if (!win) {
		console.warn("[Remote API] invokeRenderer: no TIDAL window");
		return { success: false };
	}
	try {
		const response = await win.webContents.executeJavaScript(`window.__remoteApiInvokeAction?.(${JSON.stringify(data)})`);
		return { success: true, response };
	} catch (e) {
		console.error("[Remote API] invokeRenderer error:", e);
		return { success: false };
	}
};

// --- Access control ---
// By default the server only listens on 127.0.0.1. A token is optional; when one is set every request must carry it.
// Requests from web pages (they always send an Origin header) are refused unless a valid token is sent,
// so a random website open in a browser cannot drive the player.

const hash = (value: string) => createHash("sha256").update(value).digest();
const tokenMatches = (candidate: string | null | undefined) => !!candidate && timingSafeEqual(hash(candidate), hash(token));

const requestToken = (req: IncomingMessage) => {
	const auth = req.headers.authorization;
	if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
	return new URL(req.url || "/", "http://localhost").searchParams.get("token");
};

const authorize = (req: IncomingMessage): string | undefined => {
	const hasToken = tokenMatches(requestToken(req));
	if (token && !hasToken) return "Missing or wrong token";
	if (req.headers.origin && !hasToken) return "Requests from web pages need a token (set one in the plugin settings)";
	return undefined;
};

// --- WebSocket ---

const sendWsResponse = (ws: WebSocket, payload: Record<string, unknown>) => ws.send(JSON.stringify(payload));
const sendWsError = (ws: WebSocket, error: string) => sendWsResponse(ws, { type: "error", error });

const createActionHandler = (schema: ActionSchema): NativeActionHandler => {
	return (data) => {
		const paramValue = data[schema.param as keyof WsMessage];
		if (!schema.validate(paramValue)) return { success: false };
		const payload = { action: data.action, [schema.param!]: paramValue };
		sendToRenderer(payload);
		return { success: true, response: { type: "ok", ...payload } };
	};
};

const actionHandlers: Record<string, NativeActionHandler> = Object.fromEntries(
	Object.entries(schemas).map(([action, schema]) => [action, createActionHandler(schema)]),
);

const handleWsSubscribe = (ws: WebSocket, data: WsMessage): boolean => {
	if (!Array.isArray(data.fields)) return false;
	const sub = wsSubscriptions.get(ws)!;
	sub.fields = new Set(data.fields);
	sub.all = !!data.all;
	sendWsResponse(ws, { type: "subscribed", fields: Array.from(sub.fields), all: sub.all });
	return true;
};

const handleWsUnsubscribe = (ws: WebSocket): void => {
	const sub = wsSubscriptions.get(ws)!;
	sub.fields.clear();
	sub.all = false;
	sendWsResponse(ws, { type: "unsubscribed" });
};

const handleWsMessage = async (ws: WebSocket, data: WsMessage) => {
	const { action } = data;
	if (typeof action !== "string") return sendWsError(ws, "Missing action");

	if (action === "subscribe") {
		if (!handleWsSubscribe(ws, data)) sendWsError(ws, "Malformed subscribe action");
		return;
	}
	if (action === "unsubscribe") return handleWsUnsubscribe(ws);

	const handler = actionHandlers[action];
	if (handler) {
		const result = handler(data);
		if (result.success && result.response) sendWsResponse(ws, result.response);
		else sendWsError(ws, `Malformed ${action} action`);
		return;
	}

	const result = await invokeRenderer({ ...data });
	if (result.success) sendWsResponse(ws, { type: "ok", action, data: result.response });
	else sendWsError(ws, `Action "${action}" failed or not found`);
};

const handleWsConnection = (ws: WebSocket) => {
	wsSubscriptions.set(ws, { fields: new Set(), all: false });
	ws.on("message", (message: WebSocket.RawData) => {
		try {
			const data = JSON.parse(message.toString()) as WsMessage;
			handleWsMessage(ws, data).catch((e) => console.error("[Remote API] WebSocket action error:", e));
		} catch {
			sendWsError(ws, "Invalid message format");
		}
	});
	ws.on("close", () => wsSubscriptions.delete(ws));
	ws.on("error", () => wsSubscriptions.delete(ws));
};

// --- HTTP ---

const sendHttpResponse = (res: ServerResponse, status: number, data: Record<string, unknown>) => {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
};

const parseRequestBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
	new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk;
			if (body.length > maxBodySize) {
				reject(new Error("Request body too large"));
				req.destroy();
			}
		});
		req.on("end", () => {
			try {
				const parsed = body ? JSON.parse(body) : {};
				if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
				resolve(parsed);
			} catch {
				reject(new Error("Invalid JSON"));
			}
		});
		req.on("error", reject);
	});

const handleHttpAction = async (req: IncomingMessage, res: ServerResponse) => {
	const url = new URL(req.url || "/", "http://localhost");
	const action = url.pathname.slice(1);
	if (!action) return sendHttpResponse(res, 400, { type: "error", error: "No action specified" });

	try {
		const body = await parseRequestBody(req);
		const data: WsMessage = { ...body, action };
		const handler = actionHandlers[action];
		if (handler) {
			const result = handler(data);
			if (result.success && result.response) sendHttpResponse(res, 200, result.response);
			else sendHttpResponse(res, 400, { type: "error", error: `Malformed ${action} action` });
			return;
		}
		const result = await invokeRenderer({ ...data });
		if (result.success) sendHttpResponse(res, 200, { type: "ok", action, data: result.response });
		else sendHttpResponse(res, 400, { type: "error", error: `Action "${action}" failed or not found` });
	} catch (e) {
		sendHttpResponse(res, 400, { type: "error", error: e instanceof Error ? e.message : "Invalid request" });
	}
};

const handleHttpRequest = (req: IncomingMessage, res: ServerResponse) => {
	// Only web pages that already know the token may read responses
	if (req.headers.origin && token) {
		res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
		res.setHeader("Vary", "Origin");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	}

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	const denied = authorize(req);
	if (denied) return sendHttpResponse(res, 401, { type: "error", error: denied });

	if (req.method === "POST") {
		handleHttpAction(req, res);
		return;
	}

	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify(fields, null, 2));
};

// --- Fields ---

const notifyWebSocketClients = (field: string, value: unknown) => {
	if (!wss || fields[field] === value) return;
	for (const [ws, sub] of wsSubscriptions) {
		if (ws.readyState !== WebSocket.OPEN) continue;
		if (sub.all) sendWsResponse(ws, { type: "update", all: true, fields: { ...fields, [field]: value } });
		else if (sub.fields.has(field)) sendWsResponse(ws, { type: "update", all: false, field, value });
	}
};

const updateFields = (recordedFields: Record<string, unknown>) => {
	for (const [key, value] of Object.entries(recordedFields)) {
		notifyWebSocketClients(key, value);
		fields[key] = value;
	}
};

// --- Lifecycle ---

const stopServer = async () => {
	const oldWss = wss;
	const oldServer = server;
	wss = null;
	server = null;
	if (oldWss) {
		for (const ws of oldWss.clients) ws.terminate();
		oldWss.close();
	}
	wsSubscriptions.clear();
	if (oldServer) {
		oldServer.closeAllConnections?.();
		await new Promise<void>((resolve) => oldServer.close(() => resolve()));
	}
};

const startServer = async (options: ServerOptions) => {
	await stopServer();
	token = options.token;

	const httpServer = createServer(handleHttpRequest);
	const socketServer = new WebSocketServer({
		server: httpServer,
		verifyClient: ({ req }, done) => {
			const denied = authorize(req);
			if (denied) done(false, 401, denied);
			else done(true);
		},
	});
	socketServer.on("connection", handleWsConnection);
	socketServer.on("error", (e) => console.error("[Remote API] WebSocket server error:", e));

	await new Promise<void>((resolve, reject) => {
		httpServer.once("error", reject);
		httpServer.listen(options.port, options.host, () => {
			httpServer.off("error", reject);
			resolve();
		});
	}).catch((e: NodeJS.ErrnoException) => {
		socketServer.close();
		httpServer.close();
		throw new Error(e.code === "EADDRINUSE" ? `Port ${options.port} is already in use` : e.message);
	});
	httpServer.on("error", (e) => console.error("[Remote API] HTTP server error:", e));

	server = httpServer;
	wss = socketServer;
	console.log(`[Remote API] listening on ${options.host}:${options.port}`);
};

export { startServer, stopServer, updateFields };
