# Privacy Policy: External Links to Monitor

_Last updated: 2026-11-13_

External Links to Monitor does **not collect, store, transmit, sell or share any personal
or browsing data**.

- The extension runs entirely inside your browser and makes **no network requests**.
- To decide whether a newly opened tab came from another application, it briefly reads that
  tab's URL scheme (for example `https:`), its window and its opener. Nothing is recorded.
- It reads the list of connected monitors (position, size and name) to show the monitor menu
  and to find the window on the chosen monitor.
- It stores locally, on your device only:
  - your chosen monitor (`chrome.storage.local`);
  - for the current browser session only, window focus timestamps and recently focused
    window IDs (`chrome.storage.session`, cleared when the browser closes).
- No analytics, no tracking, no third-party code. The full source code is available at
  <https://github.com/iXab3r/chromium-ext-links-to-monitor>.

Questions: open an issue at <https://github.com/iXab3r/chromium-ext-links-to-monitor/issues>.
