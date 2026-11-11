/**
 * A canvas graph's nodes as buttons, out of sight: the canvas is pixels to
 * the accessibility tree, so a screen reader or an assistive client reaches
 * the nodes through this list instead. Pressing one does what activating the
 * node on the canvas does. Out of the Tab order: an invisible focus stop
 * would strand a sighted keyboard user, and a screen reader's own cursor or
 * an AX press reaches the buttons without it.
 */
export function GraphNodeList({
  label,
  nodes,
  selectedId,
  onActivate,
}: {
  label: string;
  nodes: readonly { id: string; title: string }[];
  selectedId: string | null;
  onActivate: (id: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="sr-only">
      {nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          tabIndex={-1}
          aria-current={node.id === selectedId || undefined}
          onClick={() => onActivate(node.id)}
        >
          {node.title || node.id}
        </button>
      ))}
    </div>
  );
}
