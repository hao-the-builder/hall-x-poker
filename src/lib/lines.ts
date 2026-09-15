/**
 * Table talk for the welcome masthead. One is picked at random on each visit.
 * Original lines, written for the association; add or edit freely.
 */
export const LINES: string[] = [
  "The cards don't care who you are. Neither does the leaderboard.",
  "Fold the hand. Never fold the attitude.",
  "Luck shows up once. Skill keeps a seat.",
  "Every chip you win was somebody else's plan.",
  "Play the player. The cards are just the excuse.",
  "Scared money never makes the final table.",
  "Nobody remembers the hands you folded. Everybody remembers the river.",
  "Patience is a weapon. Most people leave it holstered.",
  "Sit down, stay quiet, count your outs.",
  "You don't need the best hand. You need to be the last one holding cards.",
  "Bluff with your chips, never with your rating.",
  "Ninth place gets a point. First place gets the stories.",
  "Quiet players. Loud stacks.",
  "All in is a decision, not a mood.",
  "Read the table before the table reads you.",
  "The deck resets every hand. Your reputation doesn't.",
];

export function randomLine(): string {
  return LINES[Math.floor(Math.random() * LINES.length)];
}
