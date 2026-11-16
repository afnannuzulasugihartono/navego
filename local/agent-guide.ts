// @last-edited: 2026-10-25 UTC+7.
// @title: agent-guide — what an agent can do here, written as tasks instead of a tool list.
// @state: recipes, side effects, honesty locks between them and the tools.
// @dependencies: none.

// WHY THIS FILE EXISTS

// An agent arriving cold does not know what to call first.
// Every tool description answers "what does this do" and never answer "I want to attach a file, what do I do" — so an agent reads all of them, in order, every session, and picks.
// Measured on this product's own author: an image upload took a dozen calls and a submenu twenty seconds of polling because the road was never written down anywhere the agent could read it.

// WHY THE RECIPES ARE DATA AND THE CHECKS ARE TESTS.
// A guide that drifts from the product is worse than none: an agent follows a route to a tool that was renamed and learns to distrust the guide.
// So the recipes name tools and the test fails the moment a name stops existing, the moment a tool has no declared side effect, and the moment a recipe points at a tool that is not on the list.
// Rot is a build failure, not a surprise in production.

// WHY SIDE EFFECTS ARE DECLARED AND NOT IMPLIED.
// Half of what an agent loses today is not a missing tool but an unannounced one: reading a Google Doc moves the caret, so the next click lands somewhere the agent had already visited.
// A tool that quietly moves something should say so in the tool list, where the agent reads before calling, not in a document it reads after being surprised.

// WHY A DOCUMENT OUTLINE IS NOT A MENU.
// Google Docs renders the document's own headings as role=menuitem, so a walk that trusts roles alone descends into the document — measured live: a menu probe on an open Docs menu returned "BAB I PENDAHULUAN" and every paragraph as menu items.
// The walk therefore treats a menu as a menu only while it hangs off a menubar or a menu that a manu item owns, and a whole branch that grows into document text is refused by name rather than walked to the end of the document.

export const RECIPES = Object.freeze([
  {
    task: 'See what is on the page',
    do: ['read'],
    note: 'On a Google Doc this reads the document itself, not the toolbar around it.'
  },
  {
    task: 'Meet a site you have never seen',
    do: ['probe', 'read'],
    note: 'probe costs one call and moves nothing, so it is the safe first step anywhere. Read the strategy it returns before paying for a read.'
  },
  {
    task: 'See what can be clicked, with coordinates',
    do: ['scan'],
    note: 'Menus and dialogs come first, so a menu the agent just opened is never past the cap.'
  },
  {
    task: 'Click a row by what it is called',
    do: ['tap'],
    note: 'One round trip: resolved and clicked in the same call, so no stale coordinates.'
  },
  {
    task: 'Click something you looked at earlier',
    do: ['grab', 'click'],
    note: 'grab hands back a handle; click with that handle measures the element again at the click, so a row that moved is still the row that gets clicked.'
  },
  {
    task: 'Open a menu and walk into a submenu',
    do: ['tap', 'wait', 'hover', 'wait'],
    note: 'Submenus need the pointer to leave and come back. Wait for the row, never for a guessed number of milliseconds.'
  },
  {
    task: 'Do several dependent moves in one call',
    do: ['run'],
    note: 'Up to eight steps on one tab, in order. The first failure stops the burst and keeps the steps that finished; the page is settled and read once at the end instead of after every move. A refFromStep carries a handle from an earlier resolve into a later click.'
  },
  {
    task: 'Wait for something to arrive or to go',
    do: ['wait'],
    note: 'Add absent:true to wait for a row to leave. Returns found:false with the page rather than hanging.'
  },
  {
    task: 'Wait until a navigation has happened',
    do: ['wait'],
    note: 'Follows a submit or a sign-in by waiting for the url to contain a string (or match a regular expression) instead of polling the text. A text wait cannot see a url move.'
  },
  {
    task: 'Wait until the page has stopped moving',
    do: ['wait'],
    note: 'For anything that moves on its own: a menu animating, a save running, an upload landing.'
  },
  {
    task: 'Put a file into a page that has a file input',
    do: ['chooser', 'tap', 'upload', 'chooser'],
    note: 'Enable interception first, click the chooser, call upload with the path or the bytes, then disable it. If upload reports inputFound:false, the site has no input — use the drop below.'
  },
  {
    task: 'Put a file into a page whose chooser has no input',
    do: ['drop'],
    note: 'A drop needs no dialog at all: the page takes the file on the drop it already listens for. If the chooser is already open - Google Docs opens it through the File System Access API - answer it with dialog, dialog and dialog, which reach it from the machine.'
  },
  {
    task: 'Take a file out of a page',
    do: ['grab', 'download'],
    note: 'Resolve the control that starts the download, then hand its handle to download with the folder you want. The file landing and stopping growing is the proof; a still-writing file, a viewer that opened instead, and a click that produced nothing each come back downloaded:false with the reason.'
  },
  {
    task: 'Deliver a client statement',
    do: ['card', 'goto', 'read', 'find', 'download', 'delivered'],
    note: 'One client, one portal, one month. The card names the file and the folder before anything is clicked; the drive gets the file; delivered checks it on disk and adds the client-month to the manifest. Never type a password: if the portal asks to sign in, the person signs in in their own browser and the same tab is used again. The answer is the proof another agent can hand to its own user: bytes, the kind of file sniffed from its bytes, the page count, and the closing balance as the portal printed it with the page named as its source. A balance that was not read is reported missing, never invented.'
  },
  {
    task: 'Ask the page a question instead of guessing',
    do: ['trace'],
    note: 'Frames, the node behind a row, a frame document, a selector, a box, a screenshot as png. Reads only — anything that acts stays a named tool.'
  },
  {
    task: 'Build a report from an exported sheet',
    do: ['report'],
    note: 'CSV in, a checked report out, written beside the source. No browser is touched: month-end reports must not depend on a tab being open. Every figure names the column and the exact rows it came from, and the plan is rechecked against those rows before the file exists.'
  },
  {
    task: 'Build a paper from JSON tables, images, and graphs',
    do: ['doc'],
    note: 'JSON in, a .docx out in one call: the checked plan (written beside the source) and the Word file built from it. Every graph names its table and columns, and the graph is recomputed from those rows before the file exists - a graph without a source, or one whose number disagrees with the table, stops the paper instead of reaching a reader.'
  },
  {
    task: 'Turn an exported sheet into an Excel workbook',
    do: ['sheet'],
    note: 'CSV in, an .xlsx out: the report lines, the source rows, and the ledger of which rows produced each figure. The totals are numbers, so the customer can use them in another sheet. The plan is rechecked against those rows before the file exists, and the plan is written beside the workbook for the next artifact that needs the same figures.'
  },
  {
    task: 'Turn a written plan into slides',
    do: ['deck'],
    note: 'JSON in, a .pptx out. A slide names a figure from the checked report and carries its value; a name the report does not hold stops the deck. The provenance of every figure is written beside the presentation, so the author can answer "where did this number come from" without opening the slide.'
  },

  {
    task: 'Sign in to a portal',
    do: ['portal', 'login', 'portal'],
    note: 'One read says whether the page wants a password, a one-time code, or a captcha. login fills the fields from a credential file the person wrote, matched by the page\'s own domain, and never returns the secret. A one-time code is never answered: portal waits while the person signs in in their own browser, and the same tab is used again. Without a credentials file the default stands - the person signs in and portal waits for them.'
  },
  {
    task: 'Solve a captcha',
    do: ['portal', 'captcha', 'portal'],
    note: 'portal names the captcha and which kind it is. captcha is opt-in: it reads the image through the solver the person configured, only on a host they allowlisted, and types the answer. A token widget cannot be solved this way - let the person click it and use portal. With no solver configured, captcha refuses and types nothing.'
  },
  {
    task: 'Prove it worked',
    do: ['shot', 'read'],
    note: 'A picture and the text, compared against what you expected. A tool saying it succeeded is not proof; the page saying so is.'
  },
  {
    task: 'Bring a window forward',
    do: ['status', 'front'],
    note: 'status names the browser in front and whether it is ours; front takes a piece of the window title. With no match, front answers the state without moving anything — pass a piece of the title to bring one forward. Never an empty match: that used to bring an arbitrary window forward.'
  }
]);

// WHY NO RECIPE FOR "FIND A FILE INPUT" ANYMORE.
// It was here for a day, written while it was the only road, and every step of it was a guess: poll, retry, hope.
// The two roads that replaced it are above, and a recipe that teaches guessing is worse than no recipe.

export const SIDE_EFFECTS = Object.freeze({
  pair: ['writes a device token to this machine\'s disk, which is the whole authority of the machine over the wallet'],
  balance: [],
  quote: [],
  topup: ['opens a payable invoice at the provider, which costs nothing until the person pays it'],
  reserve: ['arms a hold of the quoted price, which the next settle or refund will close'],
  settle: ['takes the held price from the wallet, once, for a job that was reported finished'],
  refund: ['returns the whole held price to the wallet, once, for a job that did not finish'],
  status: [],
  front: ['brings a browser window to the front of the machine, which takes the keyboard away from whatever was in front'],
  dialog: ['reads the dialog\'s title, buttons and field text — changes nothing', 'writes text into an operating system dialog outside the browser', 'presses a button on an operating system dialog outside the browser'],
  guide: [],
  menus: [],
  menu: ['opens menus by hovering and clicking levels on the way to the path you gave'],
  pin: ['pins tab-less commands to the named browser until another switch says otherwise; moves no tab by itself and steers no running drive'],
  tabs: [],
  goto: ['opens a new tab in the same browser'],
  close: ['closes a tab the caller may still be holding'],
  search: ['opens one background tab on the Bing results on the bridged path (the direct CDP fallback opens it in the foreground) and closes it before the answer returns - nothing is left on the browser, and the machine\'s own window is never brought forward'],
  read: ['with allowCaretMove, borrows the selection on a canvas editor to read the text through it, and answers caretRestored as what was measured rather than what was hoped', 'without it, that step is skipped and the reason is reported, because a canvas caret is not in the DOM and cannot be promised back'],
  probe: [],
  find: [],
  click: ['moves the pointer and presses'],
  grab: ['leaves the page alone'],
  tap: ['moves the pointer and presses'],
  hover: ['moves the pointer'],
  press: ['sends a key to whatever is focused'],
  type: ['inserts text into whatever is focused'],
  append: ['moves the caret to the end before inserting, so text lands at the end instead of wherever the caret was left'],
  scroll: ['moves the view, which can load more of a lazy page and move the page out from under coordinates you already hold'],
  inspect: [],


  stream: ['sends a key sequence to whatever is focused'],
  run: ['runs every step in order and stops at the first failure', 'settles and reads the page once at the end, not after each step'],
  wait: ['waits until text appears, a row matches, a url matches, or the page stops changing — whatever until= says'],
  trace: [],
  caret: ['selects the caret line to read it, and answers caretRestored as what was measured rather than what was hoped'],
  upload: ['fills a file input, which fires the change the page listens for'],
  drop: ['brings the tab to front and drops a file on it'],
  chooser: ['changes whether the native file picker appears on this tab'],
  download: ['brings the tab to front, clicks, and writes a file into the download folder it names'],
  card: [],
  delivered: ['writes the client-month into the manifest on disk, replacing the record only when asked'],
  report: ['writes a checked report file beside the source; no page is touched'],
  doc: ['writes a checked document plan and the Word file built from it beside the source; no page is touched'],
  sheet: ['writes an Excel workbook and a checked report plan beside the source; no page is touched'],
  deck: ['writes a PowerPoint presentation and the provenance of its figures beside the source; no page is touched'],
  portal: ['reads the gate on the page and names it — sign-in, one-time code, captcha, or nothing; types nothing', 'waits for the person to clear the gate in their own browser, then answers with the page as it stands'],
  login: ['fills the username and password fields from the credential file and submits; the secret never returns in the answer'],
  captcha: ['reads a captcha image through the configured solver, which spends the person\'s money at that service, then types the answer into the captcha field'],
  shot: [],
  scan: []
});

// WHY THE GUIDE ANSWERS ONE QUESTION AND NOT SEVERAL.
// A caller with a topic gets the roads for that task; a caller with none gets every road and every side effect, which is the whole surface in one read.
// Anything else is a filter that hides something and names nothing.

export function guide(topic: unknown) {
  const asked = String(topic ?? '').trim().toLowerCase();
  const recipes = asked
    ? RECIPES.filter((recipe) => `${recipe.task} ${recipe.note}`.toLowerCase().includes(asked))
    : RECIPES;
  return {
    recipes,
    sideEffects: Object.entries(SIDE_EFFECTS).map(([tool, effects]) => ({ tool, effects })),
    refusals: [
      'A native operating-system dialog cannot be opened, closed or filled from here — it is outside the browser.',
      'trace refuses anything that could change the page; the list is in its description.',
      'A tool that reports success is not proof. The page saying so is.',
      'A page cannot see whether the window in front of it is the one the machine has in front. Clicks and keys go nowhere while status says the window is not focused.',
      'front with no match answers the state without moving anything — pass a piece of the window title. An empty match used to bring an arbitrary window forward.',
      'A complex document or report is built as a plan on disk (report, doc, sheet, deck) before it reaches a page, not by driving cells one by one.'
    ]
  };
}