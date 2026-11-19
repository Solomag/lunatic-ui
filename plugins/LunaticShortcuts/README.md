# Lunatic Shortcuts

Extra keyboard shortcuts for TIDAL, on top of the ones TIDAL already has (Ctrl+Left/Right, Shift+Ctrl+Left/Right, Ctrl+S, Ctrl+F …):

| Keys | Action |
| --- | --- |
| Ctrl+Up / Ctrl+Down | Volume up / down |
| Ctrl+M | Mute / unmute |
| Ctrl+R | Repeat: off / all / one |
| Alt+L | Add the playing track to My Collection / remove it |
| Alt+A | Go to the playing artist |
| Alt+B | Go to the playing album |
| Alt+N | Play the selected tracks next |
| Alt+Q | Add the selected tracks to the end of the queue |
| Delete (Mac: also Backspace) | Remove the selected tracks from the open playlist, if you can edit it. Off until you turn it on |
| Ctrl+Z (Mac: Cmd+Z) | Undo the last removal while its playlist is open, also the Undo button on the notification |

Every shortcut can be rebound or turned off in **Luna Settings → Shortcuts**. Shortcuts are ignored while you type in a text field.

Needs a Luna version with the keyboard shortcut API (`Shortcut` in `@luna/lib`); on older versions the plugin loads and does nothing. Alt+N and Alt+Q use the tracks selected in any track list (album, playlist, My Collection …) through `MediaItems.fromSelection`; with nothing selected the key goes on to TIDAL. Delete and Ctrl+Z need a Luna version that can edit playlists (`Playlist.selection`, `removeItems`, `restoreItems`, TidaLuna#233); without it they are not registered. Removed tracks come back where they were, as new entries.
