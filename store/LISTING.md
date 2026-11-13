# Store submission kit

Everything needed to publish to the **Chrome Web Store** (Chrome, Brave, Vivaldi, Opera and
other Chromium browsers install from there) and **Microsoft Edge Add-ons**.

| | Chrome Web Store | Microsoft Edge Add-ons |
|---|---|---|
| Developer account | [Developer Dashboard](https://chrome.google.com/webstore/devconsole), one-time registration fee | [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login?ref=dd), free |
| Package | `dist/external-links-to-monitor-<version>.zip` (run `pwsh store/package.ps1`) | same zip |
| Icon | `icons/128.png` (inside the package) | Logo: `store/logo-300.png` |
| Screenshots | `store/screenshot-1-before.png`, `-2-after.png`, `-3-menu.png` (1280×800) | same |
| Small promo tile | `store/promo-small-440x280.png` | same |
| Review time | usually a few days | up to 7 business days |

Images are rendered from `store/assets-src/` by `pwsh store/assets-src/render.ps1`.

---

## Name
External Links to Monitor

## Short description (from manifest, 132 chars max)
Opens links coming from other apps in the browser window on the monitor you choose.

## Category
Chrome: **Tools** (or Workflow & Planning) · Edge: **Productivity**

## Detailed description
```
Using the browser on more than one monitor? When you click a link in another app (Outlook,
Teams, Slack, Telegram, a PDF, a terminal…), Windows opens it in whichever browser window
was active last. Very often that's the window on the other screen, and you end up hunting
for the new tab.

External Links to Monitor fixes that. Links that come from other applications are moved
into the browser window on the monitor you choose, and that window is brought to the front.

• Only links from other apps are affected. Tabs you open inside the browser (links,
  bookmarks, middle-click, Ctrl+T) stay exactly where you opened them.
• Choose the target monitor from the toolbar icon's right-click menu: the primary monitor,
  any specific monitor, or "Default browser behavior" to switch it off.
• If the chosen monitor is disconnected, links open normally until it comes back.
• No data collection, no network access, no tracking. Open source:
  https://github.com/iXab3r/chromium-ext-links-to-monitor

How it decides a link is "external": the new tab has no opener tab and it appeared while
the browser didn't have focus, or right after the browser was activated by another app.
```

## Single purpose
```
Moves tabs opened by other applications (external links) into a browser window on the
monitor selected by the user.
```

## Permission justifications
- **tabs**: Read the URL scheme and opener of newly created tabs to tell links opened by
  other applications apart from tabs the user opens inside the browser, then move such a
  tab to a window on the chosen monitor. URLs are not stored or transmitted.
- **system.display**: Get the list of connected monitors and their positions, to build the
  monitor menu and to find the browser window on the chosen monitor.
- **storage**: Save the user's chosen monitor locally, and keep window-focus state for the
  current session (the background service worker can be restarted at any time).
- **contextMenus**: Provide the "Open external links on" menu on the toolbar icon, where
  the user picks the monitor.
- **Host permissions**: none.

## Remote code
No. All code is included in the package.

## Data usage
Collects no user data. Tick the certifications (no selling or transferring data, not used
for unrelated purposes or for creditworthiness).

## Privacy policy URL
https://github.com/iXab3r/chromium-ext-links-to-monitor/blob/main/PRIVACY.md

## Homepage / support URL
https://github.com/iXab3r/chromium-ext-links-to-monitor ·
https://github.com/iXab3r/chromium-ext-links-to-monitor/issues

## Notes for reviewers / certification
```
Requires two monitors to see the effect.
1. Open one browser window on each monitor.
2. Focus the window on the secondary monitor, then switch to another application.
3. Click a link in that application (e.g. a link in Notepad via a .url file, an email client
   or Teams). Without the extension the tab opens on the secondary monitor; with it, the tab
   is moved to the window on the primary monitor.
4. Right-click the toolbar icon > "Open external links on" to pick another monitor or turn
   it off ("Default browser behavior").
Links opened from inside the browser are never moved.
```

## Search terms (Edge, max 7)
multi monitor, second monitor, external links, open links, window, dual screen, productivity
