// @vitest-environment happy-dom
//
// The palette's list as the accessibility tree reads it. WebKit (the macOS
// and Linux app) keeps a role-less box between a listbox and its options, and
// the options then read as plain text: every box the virtualizer adds must
// say it is presentational. Chromium flattens such boxes on its own, so only
// the real app would show a regression; this test is the cheap guard.

import { cleanup, render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { CommandPaletteGroup } from "../lib/command-palette-logic";
import { CommandPaletteContent } from "./command-palette-content";

// The virtualizer draws nothing into a zero-sized scroller, and happy-dom
// lays nothing out. It reads the scroller's rect from client*.
const SIZES = { offsetHeight: 400, offsetWidth: 460, clientHeight: 400, clientWidth: 460 };
const KEYS = Object.keys(SIZES) as (keyof typeof SIZES)[];
const originals = new Map(
  KEYS.map((key) => [key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)]),
);
beforeAll(() => {
  for (const key of KEYS) {
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => SIZES[key],
    });
  }
});
afterAll(() => {
  for (const key of KEYS) {
    const desc = originals.get(key);
    if (desc) Object.defineProperty(HTMLElement.prototype, key, desc);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});
afterEach(cleanup);

const GROUPS: CommandPaletteGroup[] = [
  {
    value: "sessions",
    label: "Recent Sessions",
    items: ["One", "Two"].map((title, i) => ({
      kind: "action" as const,
      value: title,
      searchTerms: [title],
      title,
      icon: null,
      jumpDigit: i + 1,
      run: () => {},
    })),
  },
];

function renderPalette() {
  return render(
    <CommandPaletteContent
      groups={GROUPS}
      query=""
      onQueryChange={() => {}}
      onExecute={() => {}}
      placeholder="Search"
      emptyMessage="Nothing"
    />,
  );
}

describe("the palette's list in the accessibility tree", () => {
  it("is a named listbox whose options sit under presentational boxes only", () => {
    const { container } = renderPalette();
    const listbox = container.querySelector('[role="listbox"]')!;
    expect(listbox.getAttribute("aria-label")).toBe("Results");
    const options = Array.from(listbox.querySelectorAll('[role="option"]'));
    expect(options).toHaveLength(2);
    for (const option of options) {
      for (let el = option.parentElement; el && el !== listbox; el = el.parentElement) {
        expect(el.getAttribute("role")).toBe("presentation");
      }
    }
  });

  it("announces a row's chord instead of reading it as part of its name", () => {
    const { container } = renderPalette();
    const option = container.querySelector('[role="option"]')!;
    expect(option.getAttribute("aria-keyshortcuts")).toMatch(/^(Meta|Control)\+1$/);
    expect(option.querySelector("kbd")?.getAttribute("aria-hidden")).toBe("true");
  });
});
