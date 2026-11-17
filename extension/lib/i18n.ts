// @last-edited: 2026-11-11 UTC+7.
// @title: i18n - every word the extension shows, in one table per language.
// @state: id and en; the next language is a table of the same keys, nothing else.
// @dependencies: none.

// WHY THE WORDS LIVE IN A TABLE AND NOT IN THE MARKUP.
// One reader opens the popup in Indonesian and another in English, and the layout does not change with the language - the words must not change it either.
// A table per language keeps the swap total, and a new language is a new table of the same keys and nothing else.
// The reader's language is the browser's language; anything that is not Indonesian falls back to English, which is the table every key is checked against.

const ID = {
  'status.starting': 'Memulai…',
  'status.connected': 'Terhubung',
  'status.subConnected': 'Bridge di mesin ini, menunggu perintah',
  'status.connecting': 'Menghubungkan…',
  'status.subConnecting': 'Menghubungi bridge',
  'status.subStarting': 'Menyalakan bridge',
  'status.reconnecting': 'Menyambung ulang…',
  'status.subReconnecting': 'Menyambung ulang ke bridge',
  'status.disconnected': 'Terputus',
  'status.subDisconnected': 'Bridge tidak terjangkau',
  'status.notPaired': 'Belum dipair',
  'status.subNotPaired': 'Pasangkan browser ini untuk mulai',
  'doors.dashboard': 'Buka Dashboard',
  'doors.docs': 'Dokumentasi',
  'doors.pairQuick': 'Pasangkan browser ini',
  'doors.paired': 'Browser ini sudah dipair',
  'doors.settings': 'Pengaturan',
  'doors.updateAuto': 'Update otomatis',
  'chip.labelOn': 'Tandai tab yang dipegang agent',
  'chip.labelOff': 'Jangan tandai tab agent',
  'doors.updateNow': 'Perbarui sekarang',
  'doors.forgetFolder': 'Lupakan folder',
  'update.closeable': 'Halaman ini boleh ditutup.',
  'update.title': 'Update otomatis — Navego',
  'update.state.granted': 'Folder: {name}',
  'update.state.prompt': 'Izin folder perlu diulang',
  'update.state.none': 'Belum diizinkan',
  'update.pickFailed': 'Browser ini tidak memberi izin folder: {message}',
  'update.pickAbort': 'Pemilih folder ditutup tanpa memilih apa pun.',
  'update.braveFlag': 'Browser ini menyembunyikan File System Access API. Brave menyembunyikannya di balik flag: brave://flags, cari file-system-access-api, pilih Enabled, lalu Relaunch. Chrome, Edge, Opera dan Vivaldi sudah punya.',
  'update.failed': 'Update gagal: {message}',
  'update.needsFolder': 'Update otomatis belum bisa jalan: folder atau izinnya belum ada.',
  'update.upToDate': 'Sudah terbaru ({v}).',
  'update.gateSub': 'Build baru terpasang sendiri.',
  'update.allowFolder': 'Izinkan folder sekali',
  'update.smartReady': 'Perbarui ke {v}',
  'footer.brand': 'Privasi sejak awal.',
  'footer.docs': 'Dokumentasi',
  'footer.help': 'Bantuan',
  'footer.changes': 'Catatan perubahan',
  'footer.source': 'Kode sumber di GitHub',
  'popup.title': 'Navego'
};

const EN = {
  'status.starting': 'Starting…',
  'status.connected': 'Connected',
  'status.subConnected': 'Bridge is on this machine, waiting for a command',
  'status.connecting': 'Connecting…',
  'status.subConnecting': 'Reaching the bridge',
  'status.subStarting': 'Starting the bridge',
  'status.reconnecting': 'Reconnecting…',
  'status.subReconnecting': 'Reconnecting to the bridge',
  'status.disconnected': 'Disconnected',
  'status.subDisconnected': 'The bridge cannot be reached',
  'status.notPaired': 'Not paired',
  'status.subNotPaired': 'Pair this browser to start',
  'doors.dashboard': 'Open Dashboard',
  'doors.docs': 'Documentation',
  'doors.pairQuick': 'Pair this browser',
  'doors.paired': 'This browser is paired',
  'doors.settings': 'Settings',
  'doors.updateAuto': 'Automatic updates',
  'chip.labelOn': 'Mark the tab the agent holds',
  'chip.labelOff': 'Do not mark the agent\'s tab',
  'doors.updateNow': 'Update now',
  'doors.forgetFolder': 'Forget the folder',
  'update.closeable': 'You can close this page.',
  'update.title': 'Automatic updates — Navego',
  'update.state.granted': 'Folder: {name}',
  'update.state.prompt': 'The folder permission needs to be granted again',
  'update.state.none': 'Not allowed yet',
  'update.pickFailed': 'This browser does not grant folder access: {message}',
  'update.pickAbort': 'The folder picker was closed without choosing anything.',
  'update.braveFlag': 'This browser hides the File System Access API. Brave hides it behind a flag: brave://flags, search for file-system-access-api, set it to Enabled, then Relaunch. Chrome, Edge, Opera and Vivaldi carry it.',
  'update.failed': 'The update failed: {message}',
  'update.needsFolder': 'Automatic updates cannot run yet: the folder or its permission is missing.',
  'update.upToDate': 'Already up to date ({v}).',
  'update.gateSub': 'New builds install themselves.',
  'update.allowFolder': 'Allow the folder once',
  'update.smartReady': 'Update to {v}',
  'footer.brand': 'Private from day one.',
  'footer.docs': 'Documentation',
  'footer.help': 'Help',
  'footer.changes': 'Changelog',
  'footer.source': 'Source on GitHub',
  'popup.title': 'Navego'
};

const DICTIONARIES = Object.freeze({ id: Object.freeze(ID), en: Object.freeze(EN) });

const navLang = typeof navigator !== 'undefined' ? String((navigator as Navigator & { userLanguage?: string }).userLanguage || navigator.language || '') : '';
const raw = String(navLang || 'en').toLowerCase();
const language = raw.startsWith('id') ? 'id' : 'en';

export { language };

interface I18nElement {
  textContent: string | null;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}

export interface I18nRoot {
  querySelectorAll(selector: string): Iterable<I18nElement>;
  querySelector?(selector: string): I18nElement | null | undefined;
  readonly documentElement?: I18nElement | null | undefined;
}

type I18nDocument = I18nRoot & { title: string };

const globalI18nDocument = (): I18nDocument | undefined => (globalThis as { document?: I18nDocument | undefined }).document;

export function t(key: string, vars: Record<string, unknown> = {}) {
  const table: Readonly<Record<string, string>> = DICTIONARIES[language] ?? DICTIONARIES.en;
  const template: string | undefined = table[key] ?? (DICTIONARIES.en as Readonly<Record<string, string>>)[key];
  if (template === undefined) return key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

// WHY THE APPLIER IS ONE PASS OVER THE MARKUP.
// The words are declared where they are shown, so the layout can never drift from the table; one pass fills them on load.

export function applyI18n(root: I18nRoot | undefined = globalI18nDocument()) {
  if (typeof root?.querySelectorAll !== 'function') return;
  for (const node of root.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.getAttribute('data-i18n') || '');
  }
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) {
    node.setAttribute('placeholder', t(node.getAttribute('data-i18n-placeholder') || ''));
  }
  for (const node of root.querySelectorAll('[data-i18n-aria]')) {
    node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria') || ''));
  }
  for (const node of root.querySelectorAll('[data-i18n-title]')) {
    node.setAttribute('title', t(node.getAttribute('data-i18n-title') ?? ''));
  }
  const langNode = root.documentElement ?? root.querySelector?.('html');
  if (langNode) langNode.setAttribute('lang', language);
  const titleNode = root.querySelector?.('title[data-i18n]');
  const i18nAttr = titleNode?.getAttribute('data-i18n');
  const doc = globalI18nDocument();
  if (i18nAttr && doc) doc.title = t(i18nAttr);
}
