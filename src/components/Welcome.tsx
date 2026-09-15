import { Suit } from "@/components/Suit";
import { randomLine } from "@/lib/lines";
import { ASSOCIATION_NAME } from "@/lib/site";

type Props = {
  /** Heading level: the masthead is the page's h1 on the landing page. */
  as?: "h1" | "p";
};

export function Welcome({ as: Tag = "p" }: Props) {
  const line = randomLine();
  return (
    <section className="welcome" aria-label="Welcome">
      <div className="welcome__head">
        <p className="welcome__hello">Welcome to the</p>
        <Tag className="welcome__title">{ASSOCIATION_NAME}</Tag>
      </div>
      <figure className="welcome__line">
        <Suit kind="spade" className="welcome__pip" />
        <blockquote>
          <p>{line}</p>
        </blockquote>
      </figure>
    </section>
  );
}
