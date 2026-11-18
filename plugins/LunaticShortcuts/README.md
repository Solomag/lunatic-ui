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

Every shortcut can be rebound or turned off in **Luna Settings → Shortcuts**. Shortcuts are ignored while you type in a text field.

Needs a Luna version with the keyboard shortcut API (`Shortcut` in `@luna/lib`); on older versions the plugin loads and does nothing. Alt+N and Alt+Q use the tracks selected in any track list (album, playlist, My Collection …) through `MediaItems.fromSelection`; with nothing selected the key goes on to TIDAL.
