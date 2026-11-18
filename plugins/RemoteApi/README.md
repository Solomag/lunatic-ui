# Remote API

Control TIDAL from other programs: stream bots (streamer.bot), Stream Deck, home automation or your own scripts. The plugin runs a small HTTP and WebSocket server inside TIDAL.

Based on [`@vmohammad/api`](https://github.com/vMohammad24/luna-plugins/tree/master/plugins/api) by vMohammad, which is no longer maintained and does not load on current Luna. Requested in [Inrixia/luna-plugins#230](https://github.com/Inrixia/luna-plugins/issues/230). The HTTP and WebSocket API is the same as in the original, so existing scripts keep working. One difference: browser pages (for example an OBS browser source overlay) now need a token, see below.

## Settings

- **Port**: default `24123`.
- **Allow other devices on the network**: off by default, so only programs on this computer can reach the API (`127.0.0.1`). Turn it on to control TIDAL from a phone or another PC, and set a token as well.
- **Token**: optional. When set, every request must send it as `Authorization: Bearer <token>` or `?token=<token>`.

Requests from web pages in a browser (they carry an `Origin` header) are refused unless they send the token, so a website you happen to have open cannot control your player.

## HTTP

`GET http://127.0.0.1:24123/` returns the current state as JSON: `track`, `artist`, `album`, `coverUrl`, `isrc`, `duration`, `bestQuality`, `playing`, `currentTime`, `playTime`, `lastPlayStart`, `volume`, `repeatMode`, `shuffle`, `playQueue`.

`POST http://127.0.0.1:24123/<action>` with an optional JSON body runs an action:

| Action | Body |
| --- | --- |
| `pause`, `resume`, `toggle`, `next`, `previous` | none |
| `seek` | `{ "time": 42 }` (seconds) |
| `volume` | `{ "volume": 50 }` or `{ "volume": "+5" }` / `"-5"` |
| `setRepeatMode` | `{ "mode": 0 }` (0 off, 1 all, 2 one) |
| `setShuffleMode` | `{ "shuffle": true }` |
| `playNext` | `{ "itemId": "<track id>" }` |
| `addToQueue` | `{ "itemId": "<track id>" }` |

```bash
curl -X POST http://127.0.0.1:24123/toggle
curl -X POST http://127.0.0.1:24123/addToQueue -H "Content-Type: application/json" -d "{\"itemId\":\"77646176\"}"
```

## WebSocket

Connect to `ws://127.0.0.1:24123/` and send JSON messages. Actions work the same as over HTTP: `{ "action": "next" }`, `{ "action": "seek", "time": 30 }`.

Subscribe to changes:

```json
{ "action": "subscribe", "fields": ["track", "playing"] }
{ "action": "subscribe", "fields": [], "all": true }
{ "action": "unsubscribe" }
```

Updates arrive as `{ "type": "update", "field": "playing", "value": true }`, or with `all` as `{ "type": "update", "all": true, "fields": { ... } }`.

## For plugin authors

Other plugins can add their own actions:

```ts
import { registerAction } from "@solomag/remote-api";

registerAction(unloads, "like", async (data) => {
	// ...
	return { liked: true };
});
```
