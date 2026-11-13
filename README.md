# Links to Main Monitor (Edge / Chrome extension)

With several Edge windows on several monitors, Windows opens links from other apps
(Outlook, Teams, Telegram, Slack…) in whichever Edge window was active **last**, often
the one on the second monitor.

This extension moves such **external** links into the Edge window on the **primary monitor**
and focuses it. Anything you open from inside the browser (links, bookmarks, middle-click,
Ctrl+T) stays where you opened it.

## Install
1. Download/clone this folder (keep it somewhere permanent; the browser loads it from disk).
2. Open `edge://extensions` (or `chrome://extensions`) and enable **Developer mode**.
3. Click **Load unpacked** and pick this folder.

## How it works
- A new tab counts as external if it has no opener tab and was created while the browser
  had no focus, or within 1.5 s after the browser regained focus (Windows activates the
  browser when another app opens a link).
- If that tab landed in a window that isn't on the primary display, it is moved to the
  last-focused window on the primary display. If there's no window there, nothing happens.
- Tabs restored during the first 5 s after browser start are ignored.

Tunables are at the top of `background.js` (`EXTERNAL_WINDOW_MS`, `STARTUP_GRACE_MS`, `DEBUG`).

## Troubleshooting
Set `DEBUG = true`, reload the extension, open its **service worker** console from the
extensions page and reproduce. Every new tab logs why it was moved or skipped.

## Known limitation
If you switch to the browser from another app and open a bookmark in a new tab within
1.5 s, that tab is treated as external.
