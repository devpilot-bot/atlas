# Agent drivability

Atlas is meant to be driven entirely through the macOS accessibility tree, the way
[agent-desktop](https://github.com/lahfir/agent-desktop) (or VoiceOver) sees it in
WKWebView. This page is the walk that checks it: one set of commands per surface, and
the tree each should produce. Run it after a change to anything a user clicks.

The tree is WebKit's, not Chromium's. `bun run dev` in Chrome shows a forgiving tree that
hides most of the failures below, so the walk runs on `bun run dev:app`, never on the
installed `/Applications/Atlas.app` (that runs on your real profile). The cheap,
automatic half of this is `e2e/accessibility.spec.ts`: axe over the mock backend in
Chromium and WebKit, with today's known violations in `e2e/a11y.ts`. It catches markup
rules; only this walk shows what a press actually does.

## Setup

```bash
bun run dev:app                                    # the dev build, on the .atlas-dev profile
agent-desktop list-windows --app atlas             # the accessible window: "accessible": true
W=w-1234                                           # its id
agent-desktop focus-window --window-id $W          # the tree is empty while the window is hidden
agent-desktop snapshot --window-id $W --compact    # the whole tree, refs as @snap:eN
agent-desktop find --window-id $W --role button --name "Settings"
agent-desktop click @snap:e12                      # AXPress on a ref
agent-desktop --headed press "cmd+," --window-id $W
```

Keep the window in front between commands: agent-desktop reads nothing from a window
that is behind another app's.

## What a healthy tree looks like

- Every control has a role and a name. A `group ''` with a `Click` action, or a
  `button ''`, is a finding, except the limits listed below.
- A control's name is its visible label. Shortcuts are in `aria-keyshortcuts`, not the
  name: `menuitem 'Settle session'`, not `'Settle session ⌥⌘S'`.
- Repeated controls have unique names: `Ask agent about commit 1a2b3c4`,
  `Reset Theme to default`, `Move Opus 5.5 up`.
- What is covered is out of the tree: with Settings or a destination open, the
  workspace behind it (`textfield 'Chat message'`, the session list) is absent.
- Controls revealed on hover are in the tree all the time, and pressable.

## The walk

### Window shell

```bash
agent-desktop snapshot --window-id $W --compact
```

Expect `complementary` (the sidebar), `main` holding `heading 'Atlas'` (level 1,
offscreen), `button 'Hide sidebar'` (a plain button: its label is the state),
`navigation 'Destinations'`, `navigation 'Sidebar tools'`, `splitter 'Resize the columns'`,
and `tablist 'Tabs'`.

### Sessions list

Expect `list 'Active sessions'` whose rows are each a `group` holding
`button '<title>, <project>'`, `combobox 'Snooze session'` and `button 'Settle session'`.

```bash
agent-desktop click <row button ref>     # opens the session: the switcher reads "Session: <title>"
agent-desktop right-click <row button ref>
```

The right-click gives `menu 'Session actions'` with items named without their shortcut.
Close it with a real Escape (see Limits).

### Command palette

```bash
agent-desktop --headed press "cmd+k" --window-id $W
```

Expect `list 'Results'` with its rows as `statictext '<title>'` carrying `Click`. Clicking
one runs it.

### Settings

```bash
agent-desktop --headed press "cmd+," --window-id $W
agent-desktop click <button 'Appearance' ref>
```

Expect each control named exactly as its row's heading (`switch 'Terminal screen reader
support'`), and each reset button as `Reset <setting> to default` (or `Use the value for
all projects for <setting>` on a project page). Walk every page in the settings nav; none
should show `textfield 'Chat message'`.

### Destinations (Timeline, Agent)

```bash
agent-desktop click <button 'Timeline' ref>
```

Expect `button 'Back to the session (Esc)'`, `radiogroup 'View'`, the day groups, and no
`textfield 'Chat message'`.

### Files

Open it from `combobox 'Open a surface (⌘T)'` → `menuitem 'Files'`. Expect
`outline '<project> files'` holding `treeitem '<name>'` rows, each with
`button '<name>'` (press it to open the file or toggle the folder) and, for files,
`button 'Ask agent about <name>'`. Check it on a **cold** open, after a webview reload
(`cmd+r`): that is when a loading state sits in the tree.

### Source control

Expect `radiogroup 'Source control section'` (Changes, History, GitHub), the branch
combobox, `button 'Pull'`/`'Push'`, `textfield 'Commit summary'`, `group 'Commit actions'`.
History gives `list 'Commits'`: each commit is `statictext '<refs> <subject>'` with
`Click`, followed by `button 'Ask agent about commit <sha>'`.

### Terminal

Expect `tablist 'Terminals'` and `textfield 'Terminal input'`. With Settings → Appearance →
**Terminal screen reader support** on, the output also appears as a `list` of
`statictext` lines (the prompt is readable); it switches live.

### Tabs in the surfaces pane

Expect each tab as `radiobutton '<title>'` (WebKit's mapping for an ARIA tab) followed
by its own `button 'Close <title>'`.

## Rules that keep it this way

These are WebKit behaviours: Chromium hides every one of them.

- **A box between a container and its items needs a role.** Under `role="tree"`,
  `listbox` or `list`, WebKit accepts only the item role, `group`, and `presentation`
  (the attribute, not `none`). One role-less virtualiser spacer and the tree becomes a
  group, every row with it. `command-palette-content.test.tsx` guards the palette.
- **A tree decides it is a tree once.** WebKit checks a tree's children when it first
  meets it, and never again for child changes. Don't set `role="tree"` while a skeleton
  or a message is inside; set it when the rows arrive (`project-file-tree-view.tsx`).
- **An unstyled `<ul>` is not a list.** Safari drops list semantics from `list-style: none`.
  Use `<div role="list">` and `role="listitem"`.
- **AXPress clicks the centre.** WebKit presses an element by hit-testing its centre,
  and a descendant there takes the click, `pointer-events: none` or not. A row whose
  centre has a nested control needs an empty pressable layer of its own
  (`RowPressTarget` in the sidebar).
- **`pointer-events: none` removes the press.** A hover-revealed control uses opacity
  (and zero width), never `pointer-events-none` or `hidden`.
- **`Hint` names an unnamed trigger after its tooltip.** It clones its `label` in as
  `aria-label` when the child has none, and `IconButton` spreads props over its own. When the
  tooltip and the name differ, pass `aria-label` too.
- **`aria-pressed` contradicts a label that states the action.** "Hide sidebar" with
  `aria-pressed` reads as a checked switch. Use one or the other.
- **`inert` is the way out of the tree.** The covered workspace is `inert` while Settings
  or a destination is open.

## Limits

What the walk shows and nothing in this repo can change:

| what                                                   | why                                                                             | how to drive it                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `press escape` doesn't close a menu                    | agent-desktop sends `AXCancel`; WebKit turns it into no DOM event               | a real key: `osascript -e 'tell application "System Events" to key code 53'`        |
| expanding or selecting a tree item does nothing        | WebKit fires no DOM event for an AX selection or expansion of an ARIA tree item | press the row's name `button`                                                       |
| listbox options read as `statictext`                   | WebKit's macOS mapping for an ARIA option                                       | `click` works on them                                                               |
| unnamed offscreen `button ''` beside a menu or popover | Base UI's focus guards                                                          | ignore                                                                              |
| the splitter has no ref                                | agent-desktop exposes no action on `splitter`                                   | focus it and press arrow keys                                                       |
| unnamed `incrementor` under a number field             | the native stepper of `<input type="number">`                                   | `set-value` on the textfield                                                        |
| the editor (CodeMirror) is one `textfield`             | CodeMirror's content model                                                      | `type`/`set-value`; read with `get text`                                            |
| Canvas and Spaces (React Flow) pan, zoom and drag      | pointer gestures on the pane, with no accessibility action; not walked yet      | the controls on the nodes and in the chrome                                         |
| the knowledge and memory graphs are canvases           | Pixi draws pixels                                                               | `group 'Pages in the graph'` / `group 'Memories in the graph'`: one button per node |
| timeline rows are named by their whole card            | a row is one `<button>` holding its title, branch, model and tokens             | `find --name` with a substring                                                      |
