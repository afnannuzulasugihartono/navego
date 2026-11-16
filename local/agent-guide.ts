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
    do: ['browser_read_page'],
    note: 'On a Google Doc this reads the document itself, not the toolbar around it.'
  },
  {
    task: 'See what can be clicked, with role and name',
    do: ['browser_find_element'],
    note: 'Pass role (menuitem, button, option, link) without a name to list every row of that role; with a name to find the one row.'
  },
  {
    task: 'Find one row by what it is called',
    do: ['browser_find_element'],
    note: 'role + name returns the one row, exact name first then substring, with a handle for later clicks.'
  },
  {
    task: 'Click a row by what it is called',
    do: ['browser_click'],
    note: 'Pass role and name instead of x and y: the row is resolved and clicked centred in one call — no stale coordinates.'
  },
  {
    task: 'Open a menu and walk into a submenu',
    do: ['browser_hover', 'browser_wait_until'],
    note: 'Submenus need the pointer to leave and come back. Wait for the row, never for a guessed number of milliseconds.'
  },
  {
    task: 'Walk a menu by path, not by guessing',
    do: ['browser_list_menu'],
    note: 'action=walk with a path like ["Insert","Image"] opens each level and stops; branches are hovered, never clicked into blindly.'
  },
  {
    task: 'Do several dependent moves in one call',
    do: ['browser_run_steps'],
    note: 'Up to eight steps on one tab, in order. The first failure stops the burst and keeps the steps that finished; the page is settled and read once at the end instead of after every move. A refFromStep carries a handle from an earlier step into a later click.'
  },
  {
    task: 'Wait for something to arrive or to go',
    do: ['browser_wait_until'],
    note: 'until=text looks for a text; until=row with absent:true looks for a row to leave. Returns found:false with the page rather than hanging.'
  },
  {
    task: 'Wait until a navigation has happened',
    do: ['browser_wait_until'],
    note: 'Follows a submit or a sign-in with until=url (contains or matches) instead of polling the text. A text wait cannot see a url move.'
  },
  {
    task: 'Wait until the page has stopped moving',
    do: ['browser_wait_until'],
    note: 'until=stable, for anything that moves on its own: a menu animating, a save running, an upload landing.'
  },
  {
    task: 'Put a file into a page that has a file input',
    do: ['browser_intercept_picker', 'browser_click', 'browser_upload_file', 'browser_intercept_picker'],
    note: 'Enable interception first, click the chooser (or the input), call upload with the path or the bytes, then disable it. If upload reports inputFound:false, the site has no input — use the drop below.'
  },
  {
    task: 'Put a file into a page whose chooser has no input',
    do: ['browser_drop_file'],
    note: 'A drop needs no dialog at all: the page takes the file on the drop it already listens for. If the chooser is already open - Google Docs opens it through the File System Access API - answer it with browser_type_into_dialog, which reaches it from the machine.'
  },
  {
    task: 'Take a file out of a page',
    do: ['browser_find_element', 'browser_download_file'],
    note: 'Resolve the control that starts the download, then hand its handle to browser_download_file with the folder you want. The file landing and stopping growing is the proof; a still-writing file, a viewer that opened instead, and a click that produced nothing each come back downloaded:false with the reason.'
  },
  {
    task: 'Deliver a client statement',
    do: ['delivery_plan', 'browser_open_url', 'browser_read_page', 'browser_find_element', 'browser_download_file', 'delivery_record'],
    note: 'One client, one portal, one month. The card names the file and the folder before anything is clicked; the drive gets the file; delivered checks it on disk and adds the client-month to the manifest. Never type a password: if the portal asks to sign in, the person signs in in their own browser and the same tab is used again. The answer is the proof another agent can hand to its own user: bytes, the kind of file sniffed from its bytes, the page count, and the closing balance as the portal printed it with the page named as its source. A balance that was not read is reported missing, never invented.'
  },
  {
    task: 'Build a report from an exported sheet',
    do: ['artifact_build_report'],
    note: 'CSV in, a checked report out, written beside the source. No browser is touched: month-end reports must not depend on a tab being open. Every figure names the column and the exact rows it came from, and the plan is rechecked against those rows before the file exists.'
  },
  {
    task: 'Build a paper from JSON tables, images, and graphs',
    do: ['artifact_build_document'],
    note: 'JSON in, a .docx out in one call: the checked plan (written beside the source) and the Word file built from it. Every graph names its table and columns, and the graph is recomputed from those rows before the file exists - a graph without a source, or one whose number disagrees with the table, stops the paper instead of reaching a reader.'
  },
  {
    task: 'Turn an exported sheet into an Excel workbook',
    do: ['artifact_build_workbook'],
    note: 'CSV in, an .xlsx out: the report lines, the source rows, and the ledger of which rows produced each figure. The totals are numbers, so the customer can use them in another sheet. The plan is rechecked against those rows before the file exists, and the plan is written beside the workbook for the next artifact that needs the same figures.'
  },
  {
    task: 'Turn a written plan into slides',
    do: ['artifact_build_slides'],
    note: 'JSON in, a .pptx out. A slide names a figure from the checked report and carries its value; a name the report does not hold stops the deck. The provenance of every figure is written beside the presentation, so the author can answer "where did this number come from" without opening the slide.'
  },
  {
    task: 'Sign in to a portal',
    do: ['browser_check_gate', 'browser_login', 'browser_check_gate'],
    note: "One read says whether the page wants a password, a one-time code, or a captcha. login fills the fields from a credential file the person wrote, matched by the page's own domain, and never returns the secret. A one-time code is never answered: portal waits while the person signs in in their own browser, and the same tab is used again. Without a credentials file the default stands - the person signs in and portal waits for them."
  },
  {
    task: 'Solve a captcha',
    do: ['browser_check_gate', 'browser_solve_captcha', 'browser_check_gate'],
    note: 'portal names the captcha and which kind it is. captcha is opt-in: it reads the image through the solver the person configured, only on a host they allowlisted, and types the answer. A token widget cannot be solved this way - let the person click it and use portal. With no solver configured, captcha refuses and types nothing.'
  },
  {
    task: 'Prove it worked',
    do: ['browser_screenshot', 'browser_read_page'],
    note: 'A picture and the text, compared against what you expected. A tool saying it succeeded is not proof; the page saying so is.'
  },
  {
    task: 'Bring a window forward',
    do: ['browser_status', 'browser_focus_window'],
    note: 'status names the browser in front and whether it is ours; front takes a piece of the window title. With no match, front answers the state without moving anything — pass a piece of the title to bring one forward. Never an empty match: that used to bring an arbitrary window forward.'
  }
]);

// WHY NO RECIPE FOR "FIND A FILE INPUT" ANYMORE.
// It was here for a day, written while it was the only road, and every step of it was a guess: poll, retry, hope.
// The two roads that replaced it are above, and a recipe that teaches guessing is worse than no recipe.

export const SIDE_EFFECTS = Object.freeze({
  wallet_pair_device: ['writes a device token to this machine\'s disk, which is the whole authority of the machine over the wallet'],
  wallet_get_balance: [],
  wallet_get_price: [],
  wallet_add_funds: ['opens a payable invoice at the provider, which costs nothing until the person pays it'],
  wallet_hold_price: ['arms a hold of the quoted price, which the next settle or refund will close'],
  wallet_charge: ['takes the held price from the wallet, once, for a job that was reported finished'],
  wallet_refund: ['returns the whole held price to the wallet, once, for a job that did not finish'],
  browser_status: [],
  browser_focus_window: ['brings a browser window to the front of the machine, which takes the keyboard away from whatever was in front'],
  browser_focus_tab: ['brings the window holding one named tab to the front, instead of guessing by window title'],
  browser_read_dialog: ['reads the dialog\'s title, buttons and field text outside the browser — changes nothing'],
  browser_type_into_dialog: ['writes text into an operating system dialog outside the browser and reads the field back'],
  browser_press_dialog_button: ['presses a button on an operating system dialog outside the browser'],
  browser_get_guide: [],
  browser_list_menu: ['reads the menu markup and answers — never clicks'],
  browser_walk_menu: ['opens menus by hovering and clicking levels on the way to the path you gave'],
  browser_select_browser: ['pins tab-less commands to the named browser until another switch says otherwise; moves no tab by itself and steers no running drive'],
  browser_list_tabs: [],
  browser_open_url: ['opens a new tab in the same browser'],
  browser_close_tab: ['closes a tab the caller may still be holding'],
  browser_search_web: ['opens one background tab on the Bing results on the bridged path (the direct CDP fallback opens it in the foreground) and closes it before the answer returns - nothing is left on the browser, and the machine\'s own window is never brought forward'],
  browser_read_page: ['with allowCaretMove, borrows the selection on a canvas editor to read the text through it, and answers caretRestored as what was measured rather than what was hoped', 'without it, that step is skipped and the reason is reported, because a canvas caret is not in the DOM and cannot be promised back'],
  browser_find_text: [],
  browser_find_element: [],
  browser_click: ['moves the pointer and presses'],
  browser_hover: ['moves the pointer'],
  browser_press_key: ['sends a key to whatever is focused'],
  browser_type_text: ['inserts text into whatever is focused', 'atEnd: moves the caret to the end before inserting, so text lands at the end instead of wherever the caret was left'],
  browser_scroll: ['moves the view, which can load more of a lazy page and move the page out from under coordinates you already hold'],
  browser_run_steps: ['runs every step in order and stops at the first failure', 'settles and reads the page once at the end, not after each step'],
  browser_wait_until: ['waits until text appears, a row matches, a url matches, or the page stops changing — whatever until= says'],
  browser_upload_file: ['fills a file input, which fires the change the page listens for'],
  browser_drop_file: ['brings the tab to front and drops a file on it'],
  browser_intercept_picker: ['changes whether the native file picker appears on this tab'],
  browser_download_file: ['brings the tab to front, clicks, and writes a file into the download folder it names'],
  delivery_plan: [],
  delivery_record: ['writes the client-month into the manifest on disk, replacing the record only when asked'],
  artifact_build_report: ['writes a checked report file beside the source; no page is touched'],
  artifact_build_document: ['writes a checked document plan and the Word file built from it beside the source; no page is touched'],
  artifact_build_workbook: ['writes an Excel workbook and a checked report plan beside the source; no page is touched'],
  artifact_build_slides: ['writes a PowerPoint presentation and the provenance of its figures beside the source; no page is touched'],
  browser_check_gate: ['reads the gate on the page and names it — sign-in, one-time code, captcha, or nothing; types nothing', 'waits for the person to clear the gate in their own browser, then answers with the page as it stands'],
  browser_login: ['fills the username and password fields from the credential file and submits; the secret never returns in the answer'],
  browser_solve_captcha: ['reads a captcha image through the configured solver, which spends the person\'s money at that service, then types the answer into the captcha field'],
  browser_screenshot: []
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
      'A native operating-system dialog cannot be opened, closed or filled from here — try browser_type_into_dialog or browser_press_dialog_button instead, which reach the dialog from the machine.',
      'There is no raw CDP escape hatch — anything that can change the page is a named tool, by design.',
      'A tool that reports success is not proof. The page saying so is.',
      'A page cannot see whether the window in front of it is the one the machine has in front. Clicks and keys go nowhere while status says the window is not focused.',
      'front with no match answers the state without moving anything — pass a piece of the window title. An empty match used to bring an arbitrary window forward.',
      'A complex document or report is built as a plan on disk (report, doc, sheet, deck) before it reaches a page, not by driving cells one by one.'
    ]
  };
}