# External Links to Monitor: a Chromium / Edge extension

With browser windows on several monitors, Windows opens links from other apps
(Outlook, Teams, Telegram, Slack…) in whichever browser window was active **last**,
often the one on the "wrong" monitor.

This extension moves such **external** links into a browser window on the monitor
**you choose** and focuses it. Anything you open from inside the browser (links,
bookmarks, middle-click, Ctrl+T) stays where you opened it.

Works in Microsoft Edge, Google Chrome, Brave, Vivaldi, Opera and other Chromium-based browsers.

## Install
1. Download or clone this folder and keep it somewhere permanent, because the browser
   loads the extension from disk.
2. Open `edge://extensions` (or `chrome://extensions`) and enable **Developer mode**.
3. Click **Load unpacked** and pick this folder.
4. Optionally pin the icon to the toolbar.

## Choosing the monitor
Right-click the extension's toolbar icon and open **Open external links on**:

```
Open external links on ▸  ○ Default browser behavior
                          ──────────────────────────
                          ● Primary monitor
                          ○ 1: DELL U2720Q — 2560×1440 (primary)
                          ○ 2: Monitor — 1920×1080
```

- **Default browser behavior**: the extension does nothing, and the icon shows an `off` badge.
- **Primary monitor**: follows whichever monitor Windows treats as primary. This is the default.
- **A specific monitor**: if that monitor is disconnected, links open normally until it comes back.

Hover over the icon to see the current choice. The setting is stored locally per machine.

## How it works
- A new tab counts as external if it has no opener tab and was created while the browser
  had no focus, or within 1.5 s after the browser regained focus (Windows activates the
  browser when another app opens a link).
- If that tab landed in a window that isn't on the target monitor, it is moved to the most
  recently focused window on that monitor. If there's no window there, nothing happens.
- Tabs restored during the first 5 s after browser start are ignored.

Tunables are at the top of `background.js` (`EXTERNAL_WINDOW_MS`, `STARTUP_GRACE_MS`, `DEBUG`).

## Troubleshooting
Set `DEBUG = true`, reload the extension, open its **service worker** console from the
extensions page and reproduce the problem. Every new tab logs why it was moved or skipped.

## Known limitation
If you switch to the browser from another app and open a bookmark in a new tab within
1.5 s, that tab is treated as external.

## License
[MIT](LICENSE)
