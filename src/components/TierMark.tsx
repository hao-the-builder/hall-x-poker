import type { Tier } from "@/lib/rating";

type Props = {
  tier: Tier | null;
  provisional?: boolean;
  size?: "md" | "lg" | "xl";
};

/**
 * Letter tier drawn like a card index: serif letter in a small bordered box.
 * A dotted border marks a provisional rating (fewer than 3 matches).
 */
export function TierMark({ tier, provisional = false, size = "md" }: Props) {
  if (!tier) return <span className="rating--unrated">unrated</span>;
  const cls = ["tier", `tier--${tier.toLowerCase()}`, `tier--${size}`, provisional ? "tier--prov" : ""]
    .filter(Boolean)
    .join(" ");
  const label = `Tier ${tier}${provisional ? ", provisional" : ""}`;
  return (
    <span className={cls} role="img" aria-label={label} title={label}>
      {tier}
    </span>
  );
}
