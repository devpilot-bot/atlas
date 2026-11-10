// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { editorThemeExtensions } from "./build-cm-theme";

/**
 * The code font setting (`codeFontFamily`) and a theme's `font-mono` reach the
 * editor through `var(--font-mono)`. CodeMirror's base theme declares
 * `font-family: monospace` on `.cm-scroller`, and a property declared on an
 * element beats anything it would inherit, so a stack set on the editor root
 * (`&`) never reaches the content or the gutters: the editor sat in the
 * platform's generic monospace whatever the setting said. The theme must
 * declare the font on the scroller itself, after the base theme's rule.
 *
 * StyleModule mounts every theme into one `<style>` in `<head>`, base theme
 * first, so this reads that sheet back and checks the last `font-family` on a
 * `.cm-scroller` rule is the app's.
 */

function mountedScrollerFonts(): string[] {
  const css = Array.from(document.head.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("\n");
  const fonts: string[] = [];
  for (const match of css.matchAll(/([^{}]*\.cm-scroller)\s*\{([^}]*)\}/g)) {
    const font = /font-family:\s*([^;]+)/.exec(match[2]);
    if (font) fonts.push(font[1].trim());
  }
  return fonts;
}

let view: EditorView | null = null;
afterEach(() => {
  view?.destroy();
  view = null;
});

describe("editor font", () => {
  it("sets var(--font-mono) on .cm-scroller, after CodeMirror's own monospace", () => {
    view = new EditorView({
      state: EditorState.create({ doc: "const a = 1;", extensions: [editorThemeExtensions()] }),
      parent: document.body,
    });
    const fonts = mountedScrollerFonts();
    // The base theme's rule is there — that is what we have to outrank.
    expect(fonts).toContain("monospace");
    expect(fonts[fonts.length - 1]).toBe("var(--font-mono)");
  });
});
