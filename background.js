// External Links to Monitor
//
// Tabs opened from OUTSIDE the browser (Outlook, Teams, Telegram...) are moved into a
// browser window on the monitor chosen in the toolbar icon's right-click menu.
// Anything opened while working in the browser (links, bookmarks, middle-click, Ctrl+T)
// stays where it was opened.
//
// "External" = the tab has no opener and was created while the browser had no focus,
// or within a moment after it regained focus (Windows activates the browser when
// another app opens a link).

const STARTUP_GRACE_MS = 5000;   // ignore session restore right after browser start
const EXTERNAL_WINDOW_MS = 1500; // how soon after regaining focus a tab counts as external
const DEBUG = false;             // true -> log every decision to the service worker console

const DEFAULT = "default";       // setting value: don't move anything
const PRIMARY = "primary";       // setting value: whichever monitor is primary
const MENU_ROOT = "root";

const log = (...a) => DEBUG && console.log("[links-to-monitor]", ...a);

// ---------- settings (storage.local: display ids are machine-specific) ----------

async function getTarget() {
  const { target = PRIMARY } = await chrome.storage.local.get("target");
  return target;
}

// Resolve the setting to a display, or null (= default behavior / monitor not connected).
async function targetDisplay() {
  const target = await getTarget();
  if (target === DEFAULT) return null;
  const displays = await chrome.system.display.getInfo();
  if (target === PRIMARY) return displays.find(d => d.isPrimary) || displays[0];
  return displays.find(d => d.id === target) || null;
}

// ---------- monitors & windows ----------

function onDisplay(win, d) {
  const b = d.bounds, cx = win.left + win.width / 2, cy = win.top + win.height / 2;
  return cx >= b.left && cx < b.left + b.width && cy >= b.top && cy < b.top + b.height;
}

async function sortedDisplays() {
  const ds = await chrome.system.display.getInfo();
  return ds.sort((a, b) => a.bounds.left - b.bounds.left || a.bounds.top - b.bounds.top);
}

function displayLabel(d, i) {
  const name = d.name && !/^generic/i.test(d.name) ? d.name : "Monitor";
  return `${i + 1}: ${name} — ${d.bounds.width}×${d.bounds.height}`;
}

// Most recently focused normal window on the given display.
async function findWindowOn(display, excludeId) {
  const wins = (await chrome.windows.getAll({ windowTypes: ["normal"] }))
    .filter(w => w.id !== excludeId && !w.incognito && w.state !== "minimized" && onDisplay(w, display));
  if (!wins.length) return null;
  const { recent = [] } = await chrome.storage.session.get("recent");
  const rank = id => { const i = recent.indexOf(id); return i < 0 ? 1e9 : i; };
  return wins.sort((a, b) => rank(a.id) - rank(b.id))[0];
}

// ---------- context menu on the toolbar icon ----------
// Open external links on ▸  Default browser behavior
//                           ──────────────
//                           Primary monitor
//                           1: DELL U2720Q — 2560×1440 (primary)
//                           2: Monitor — 1920×1080

let rebuilding = Promise.resolve();
function rebuildMenu() { return (rebuilding = rebuilding.then(doRebuildMenu, doRebuildMenu)); }

async function doRebuildMenu() {
  const [target, displays] = await Promise.all([getTarget(), sortedDisplays()]);
  await chrome.contextMenus.removeAll();
  const add = props => chrome.contextMenus.create({ contexts: ["action"], parentId: MENU_ROOT, ...props });

  chrome.contextMenus.create({ id: MENU_ROOT, title: "Open external links on", contexts: ["action"] });
  add({ id: DEFAULT, type: "radio", title: "Default browser behavior", checked: target === DEFAULT });
  add({ id: "sep", type: "separator" });
  add({ id: PRIMARY, type: "radio", title: "Primary monitor", checked: target === PRIMARY });
  displays.forEach((d, i) => add({
    id: d.id, type: "radio",
    title: displayLabel(d, i) + (d.isPrimary ? " (primary)" : ""),
    checked: target === d.id,
  }));
  if (![DEFAULT, PRIMARY].includes(target) && !displays.some(d => d.id === target)) {
    const { targetLabel = "Saved monitor" } = await chrome.storage.local.get("targetLabel");
    add({ id: target, type: "radio", title: `${targetLabel} (not connected)`, checked: true });
  }
  await updateTitle(target, displays);
}

async function updateTitle(target, displays) {
  let what = "primary monitor";
  if (target === DEFAULT) what = "default browser behavior";
  else if (target !== PRIMARY) {
    const i = displays.findIndex(d => d.id === target);
    what = i >= 0 ? displayLabel(displays[i], i) : "a monitor that is not connected";
  }
  await chrome.action.setTitle({ title: `External links → ${what}\n(right-click the icon to change)` });
  await chrome.action.setBadgeText({ text: target === DEFAULT ? "off" : "" });
}

chrome.contextMenus.onClicked.addListener(async info => {
  const id = String(info.menuItemId);
  if (id === MENU_ROOT) return;
  const displays = await sortedDisplays();
  const i = displays.findIndex(d => d.id === id);
  const update = { target: id };
  if (i >= 0) update.targetLabel = displayLabel(displays[i], i);
  await chrome.storage.local.set(update);
  log("target set to", id);
  await rebuildMenu(); // radios are split into two groups by the separator: re-sync checkmarks
});

chrome.runtime.onInstalled.addListener(() => rebuildMenu());
chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.session.set({ browserStartedAt: Date.now() });
  await rebuildMenu();
});
chrome.system.display.onDisplayChanged.addListener(() => rebuildMenu());

// ---------- focus tracking (storage.session: the service worker gets restarted) ----------

chrome.windows.onFocusChanged.addListener(async id => {
  log("focus", id);
  if (id === chrome.windows.WINDOW_ID_NONE) {
    await chrome.storage.session.set({ focused: false });
    return;
  }
  const s = await chrome.storage.session.get(["focused", "recent"]);
  const update = { focused: true, recent: [id, ...(s.recent || []).filter(x => x !== id)].slice(0, 20) };
  if (s.focused === false) update.gainedAt = Date.now(); // came back from another app
  await chrome.storage.session.set(update);
});

// ---------- the actual work ----------

chrome.tabs.onCreated.addListener(async tab => {
  const url = tab.pendingUrl || tab.url || "";
  const s = await chrome.storage.session.get(["focused", "gainedAt", "browserStartedAt"]);
  log("tab created", { url, opener: tab.openerTabId, win: tab.windowId, ...s });

  if (Date.now() - (s.browserStartedAt || 0) < STARTUP_GRACE_MS) return log("skip: startup grace");
  if (tab.openerTabId !== undefined || tab.incognito) return log("skip: has opener / incognito");
  if (!/^(https?|file):/i.test(url)) return log("skip: url");
  const external = s.focused === false || Date.now() - (s.gainedAt || 0) < EXTERNAL_WINDOW_MS;
  if (!external) return log("skip: opened from inside the browser");

  const display = await targetDisplay();
  if (!display) return log("skip: default behavior, or target monitor not connected");

  const src = await chrome.windows.get(tab.windowId);
  if (onDisplay(src, display)) return log("skip: already on target monitor");

  const target = await findWindowOn(display, src.id);
  if (!target) return log("skip: no browser window on target monitor");

  log("moving to window", target.id);
  await chrome.tabs.move(tab.id, { windowId: target.id, index: -1 });
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(target.id, { focused: true });
});
