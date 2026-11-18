// @last-edited: 2026-11-11 UTC+7.
// @title: popup — MV3 runtime.
// @state: Indonesian copy; one firm status line, the facts of the device, and the doors out: dashboard, docs, the signed package, and the update.
// @dependencies: agent-log, error-messages, endpoints.

import './lib/agent-log.js';
import { userErrorMessage } from './lib/error-messages.js';
import { SITE_ORIGIN } from './lib/endpoints.js';
import { applyNewBuild, forgetFolderHandle, folderPermission } from './worker/self-update.js';
import { servedVersion, newerThan } from './lib/self-update.js';
import { t, applyI18n } from './lib/i18n.js';
import { isRecord } from './lib/guards.js';
applyI18n(document);
const log = globalThis.NavegoLog;
if (typeof log?.warn !== 'function') throw new Error('Agent log runtime is unavailable.');
const $ = (id: string) => document.getElementById(id);

type UpdateDoorMode = 'allow' | 'apply' | 'idle';
let updateDoorMode: UpdateDoorMode = 'idle';
let pairedState = false;

// THE ISLAND SPEAKS ONCE.
// The reader opens the popup to answer one question: is it connected?
// One line, one icon - no colour shouting, no second line, no dot to hunt.
// The tone moves the icon; the words carry the meaning.

type StatusState = { tone: 'ready' | 'pending' | 'idle'; main: string; sub: string };

const setStatus = (state: StatusState) => {
  const main = $('statusMain');
  const sub = $('statusSub');
  const host = document.getElementById('status');
  if (main) main.textContent = state.main;
  if (sub) sub.textContent = state.sub;
  if (host) host.dataset.tone = state.tone;
};

setStatus({ main: t('status.starting'), sub: t('status.subStarting'), tone: 'pending' });

// THE PAIR BUTTON IS A STATE, NOT AN ACTION, ONCE PAIRED.
// The button's promise is pairing; after the pair, the honest thing is to say so and point at where the pairing lives, not to stand there inviting the reader to pair again.
// Green is the licence of the paired state: this is done, not decorative.

const setPairCta = (paired: boolean) => {
  const button = $('pairQuickButton');
  if (!button) return;
  pairedState = paired;
  button.classList.toggle('ctaDone', paired);
  const bolt = button.querySelector('.ctaBolt');
  const check = button.querySelector('.ctaCheck');
  const setHidden = (el: Element | null, hidden: boolean) => {
    if (!el) return;
    if (hidden) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  };
  setHidden(bolt, paired);
  setHidden(check, !paired);
  const label = button.querySelector('.ctaText');
  if (label) {
    label.textContent = t(paired ? 'doors.paired' : 'doors.pairQuick');
    label.setAttribute('data-i18n', paired ? 'doors.paired' : 'doors.pairQuick');
  }
};

setPairCta(false);

// THE POPUP ASKS THE SERVER WHICH VERSION IS SERVED.
// Chrome updates an installed extension on its own, but only when it was installed as a signed package; an extension loaded unpacked never asks the update service, and the person sees a version that simply stands still.
// The popup therefore asks what the server serves and says so out loud, because a version that does not move is otherwise a mystery with no handle on it.

// ONE DOOR FOR THE UPDATE.
// Three doors for one job said three different things; the button now either asks to allow the folder once, or writes the new build over the granted folder in one press.
// The folder picker cannot live in the popup - it takes the focus and the popup closes with it - so the allow path opens the update page, which finishes the job itself once the folder is picked.
// After the one allow, updates run on the worker's own timer; the button stays for the impatient.

async function showServedVersion(installed: string) {
  const door = $('updateDoorButton');
  const title = $('updateDoorTitle');
  const forget = $('forgetFolderButton');
  if (!door) return;
  const permission = await folderPermission();
  if (forget) forget.hidden = permission !== 'granted';
  if (permission !== 'granted') {
    updateDoorMode = 'allow';
    door.hidden = false;
    door.classList.remove('doorAccent', 'rowAmber');
    if (title) title.textContent = t('update.allowFolder');
    return;
  }
  const served = await servedVersion();
  if (served && newerThan(installed, served)) {
    updateDoorMode = 'apply';
    door.hidden = false;
    door.classList.remove('doorAccent');
    door.classList.add('rowAmber');
    if (title) title.textContent = t('update.smartReady', { v: served });
    return;
  }
  updateDoorMode = 'idle';
  door.hidden = true;
}

async function call(action: string, extra: Record<string, unknown> = {}) {
  return chrome.runtime.sendMessage({ scope: 'navego-popup', action, ...extra });
}

// THE POPUP SPEAKS TWICE.
// A verdict without a reason is a mystery; a reason without a verdict is noise.
// One line for each, no third line.

function statusLine(status: unknown, paired: boolean): StatusState {
  if (!paired) return { main: t('status.notPaired'), sub: t('status.subNotPaired'), tone: 'idle' };
  if (status === 'ready') return { main: t('status.connected'), sub: t('status.subConnected'), tone: 'ready' };
  if (status === 'connecting') return { main: t('status.connecting'), sub: t('status.subConnecting'), tone: 'pending' };
  if (status === 'reconnecting') return { main: t('status.reconnecting'), sub: t('status.subReconnecting'), tone: 'pending' };
  if (status === 'starting') return { main: t('status.starting'), sub: t('status.subStarting'), tone: 'pending' };
  return { main: t('status.disconnected'), sub: t('status.subDisconnected'), tone: 'idle' };
}
async function refresh() {
  let data: unknown;
  try {
    data = await call('status');
  } catch (error) {
    log?.debug?.('POPUP_REFRESH_FAILED', error instanceof Error ? error.message : String(error));
    return;
  }
  const reply = isRecord(data) ? data : undefined;
  if (!reply?.ok) return;
  const versionEl = $('version');
  if (versionEl) versionEl.textContent = `${reply.version} Protocol ${reply.protocolVersion}`;
  void showServedVersion(String(reply.version));
  const state = isRecord(reply.state) ? reply.state : {};
  const config = isRecord(reply.config) ? reply.config : {};
  const paired = !!config.paired;
  setPairCta(paired);
  const status = String(state.status || (paired ? 'connecting' : 'unpaired'));
  const line = statusLine(status, paired);
  setStatus(line);
  const errorEl = $('error');
  if (errorEl) {
    errorEl.hidden = !state.lastError;
    errorEl.textContent = state.lastError ? userErrorMessage(state.lastError) ?? '' : '';
  }
}

// THE TOGGLE LIVES IN THE POPUP.
// The chip is the page half; this is the one place the reader can turn it off.

const chipToggleText = $('chipToggleText');
const chipToggleButton = $('chipToggleButton');

async function showChipState() {
  if (!chipToggleButton) return;
  const stored = await chrome.storage.local.get(['oa_chip_enabled']) as { oa_chip_enabled?: unknown };
  const on = stored.oa_chip_enabled !== false;
  chipToggleButton.setAttribute('aria-checked', String(on));
  if (chipToggleText) chipToggleText.textContent = on ? t('chip.labelOn') : t('chip.labelOff');
}

void showChipState();

chipToggleButton?.addEventListener('click', async () => {
  const stored = await chrome.storage.local.get(['oa_chip_enabled']) as { oa_chip_enabled?: unknown };
  const on = stored.oa_chip_enabled !== false;
  await chrome.storage.local.set({ oa_chip_enabled: !on });
  void showChipState();
});



// THE DOORS OPEN A TAB AND NOT A WINDOW.
// The person is already in a browser with the tabs they work in; a door that opens a separate window is a second place to look for the same thing.

const openTab = async (url: string) => {
  try {
    await chrome.tabs.create({ url });
  } catch (error) {
    log?.debug?.('TAB_OPEN_FAILED', error instanceof Error ? error.message : String(error));
  }
};

$('dashboardButton')?.addEventListener('click', async () => { void openTab(`${SITE_ORIGIN}/dashboard.html`); });
$('docsButton')?.addEventListener('click', async () => { void openTab(`${SITE_ORIGIN}/docs.html`); });
$('pairQuickButton')?.addEventListener('click', async () => { void openTab(pairedState ? `${SITE_ORIGIN}/dashboard.html` : `${SITE_ORIGIN}/dashboard.html?pair=1#pairing`); });
$('optionsButton')?.addEventListener('click', async () => { void chrome.tabs.create({ url: chrome.runtime.getURL('options.html') }); });

// THE SMART DOOR BRANCHES.
// Not granted yet: the press opens the update page, which holds the folder picker the popup cannot hold, and finishes the job itself once the pick happens.
// Granted and a newer build: the press writes it over the folder and restarts the worker, no file explorer involved.

$('updateDoorButton')?.addEventListener('click', async () => {
  const button = $('updateDoorButton');
  if (!(button instanceof HTMLButtonElement)) return;
  if (updateDoorMode === 'allow') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('update.html') });
    return;
  }
  if (updateDoorMode !== 'apply') return;
  button.disabled = true;
  try {
    const outcome = await applyNewBuild({ installedVersion: chrome.runtime.getManifest().version });
    if (outcome.ok && outcome.changed) {
      chrome.runtime.reload();
      return;
    }
    const title = $('updateDoorTitle');
    const original = title ? title.textContent : '';
    if (title) {
      title.textContent = outcome.ok
        ? t('update.upToDate', { v: outcome.version || chrome.runtime.getManifest().version })
        : t('update.needsFolder');
      window.setTimeout(() => { title.textContent = original; }, 2400);
    }
    await showServedVersion(chrome.runtime.getManifest().version);
  } catch (error) {
    log?.warn?.('AUTO_UPDATE_FAILED', error instanceof Error ? error.message : String(error));
  } finally {
    button.disabled = false;
  }
});

$('forgetFolderButton')?.addEventListener('click', async () => {
  try {
    await forgetFolderHandle();
    await showServedVersion(chrome.runtime.getManifest().version);
  } catch (error) {
    const errorEl = $('error');
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = userErrorMessage(error instanceof Error ? error.message : String(error)) ?? '';
    }
  }
});

const refreshQuietly = () => { refresh().catch(() => {}) };

refreshQuietly();
setInterval(refreshQuietly, 1500);
