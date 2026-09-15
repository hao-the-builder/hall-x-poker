export type SuitKind = "spade" | "heart" | "diamond" | "club";

const GLYPH: Record<SuitKind, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const RED: Record<SuitKind, boolean> = {
  spade: false,
  heart: true,
  diamond: true,
  club: false,
};

export const PODIUM_SUITS: SuitKind[] = ["spade", "heart", "diamond"];

export function Suit({ kind, className = "" }: { kind: SuitKind; className?: string }) {
  return (
    <span className={`suit ${RED[kind] ? "suit--red" : ""} ${className}`.trim()} aria-hidden="true">
      {GLYPH[kind]}
    </span>
  );
}
