// Moves tabs opened from OUTSIDE the browser (Outlook, Teams, Telegram...) into the
// Edge window on the primary monitor. Anything you open while working in Edge
// (bookmarks, middle-clicks, Ctrl+T, links) stays where it was opened.
//
// "External" = the tab was created while Edge didn't have focus, or within a moment
// after Edge regained focus (Windows activates the browser when another app opens a link).

const STARTUP_GRACE_MS = 5000;   // ignore session restore right after launch
const EXTERNAL_WINDOW_MS = 1500; // how soon after Edge regains focus a tab counts as external

// NB: the MV3 service worker is killed after ~30s idle and restarted on the next event,
// so the browser start time must be stored, not taken from module load time.
chrome.runtime.onStartup.addListener(() =>
  chrome.storage.session.set({ browserStartedAt: Date.now() }));

async function inStartupGrace() {
  const { browserStartedAt = 0 } = await chrome.storage.session.get("browserStartedAt");
  return Date.now() - browserStartedAt < STARTUP_GRACE_MS;
}

const DEBUG = false; // set to true to see decisions in the service worker console
const log = (...a) => DEBUG && console.log("[main-monitor]", ...a);
log("service worker loaded, v" + chrome.runtime.getManifest().version);

async function primaryBounds() {
  const displays = await chrome.system.display.getInfo();
  return (displays.find(d => d.isPrimary) || displays[0]).bounds;
}

function onDisplay(win, b) {
  const cx = win.left + win.width / 2, cy = win.top + win.height / 2;
  return cx >= b.left && cx < b.left + b.width && cy >= b.top && cy < b.top + b.height;
}

// Track browser focus (state kept in storage.session: the service worker can be restarted).
chrome.windows.onFocusChanged.addListener(async id => {
  log("focus", id);
  const s = await chrome.storage.session.get(["focused"]);
  if (id === chrome.windows.WINDOW_ID_NONE) {
    await chrome.storage.session.set({ focused: false });
    return;
  }
  const update = { focused: true };
  if (s.focused === false) update.gainedAt = Date.now(); // came back from another app
  try {
    const win = await chrome.windows.get(id);
    if (win.type === "normal" && onDisplay(win, await primaryBounds())) update.mainWin = id;
  } catch {}
  await chrome.storage.session.set(update);
});

async function isExternal() {
  const { focused, gainedAt = 0 } = await chrome.storage.session.get(["focused", "gainedAt"]);
  return focused === false || Date.now() - gainedAt < EXTERNAL_WINDOW_MS;
}

async function findMainWindow(excludeId) {
  const b = await primaryBounds();
  const wins = (await chrome.windows.getAll({ windowTypes: ["normal"] }))
    .filter(w => w.id !== excludeId && !w.incognito && w.state !== "minimized" && onDisplay(w, b));
  if (!wins.length) return null;
  const { mainWin } = await chrome.storage.session.get("mainWin");
  return wins.find(w => w.id === mainWin) || wins[0];
}

chrome.tabs.onCreated.addListener(async tab => {
  const url = tab.pendingUrl || tab.url || "";
  const st = await chrome.storage.session.get(["focused", "gainedAt"]);
  log("tab created", { url, opener: tab.openerTabId, win: tab.windowId, ...st, sinceGain: Date.now() - (st.gainedAt || 0) });
  if (await inStartupGrace()) return log("skip: startup grace");
  if (tab.openerTabId !== undefined || tab.incognito) return log("skip: has opener");
  if (!/^(https?|file):/i.test(url)) return log("skip: url");
  if (!(await isExternal())) return log("skip: not external");

  const src = await chrome.windows.get(tab.windowId);
  if (onDisplay(src, await primaryBounds())) return log("skip: already on primary");

  const target = await findMainWindow(src.id);
  if (!target) return log("skip: no window on primary monitor");
  log("moving to window", target.id);
  await chrome.tabs.move(tab.id, { windowId: target.id, index: -1 });
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(target.id, { focused: true });
});
