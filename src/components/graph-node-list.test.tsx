// @vitest-environment happy-dom
//
// A canvas graph is pixels to the accessibility tree; this list is the only
// way an assistive client reaches its nodes.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GraphNodeList } from "./graph-node-list";

afterEach(cleanup);

describe("GraphNodeList", () => {
  it("names each node, marks the selected one, and hands a press to onActivate", () => {
    const onActivate = vi.fn();
    render(
      <GraphNodeList
        label="Pages in the graph"
        nodes={[
          { id: "a", title: "Alpha" },
          { id: "b", title: "" },
        ]}
        selectedId="a"
        onActivate={onActivate}
      />,
    );
    expect(screen.getByRole("group", { name: "Pages in the graph" })).toBeTruthy();
    const alpha = screen.getByRole("button", { name: "Alpha" });
    expect(alpha.getAttribute("aria-current")).toBe("true");
    expect(alpha.tabIndex).toBe(-1);
    // An untitled node falls back to its id rather than an empty name.
    const untitled = screen.getByRole("button", { name: "b" });
    expect(untitled.getAttribute("aria-current")).toBeNull();
    fireEvent.click(untitled);
    expect(onActivate).toHaveBeenCalledWith("b");
  });
});
