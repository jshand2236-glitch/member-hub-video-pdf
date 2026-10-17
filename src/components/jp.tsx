import { Fragment } from "react";
import { loadDefaultJapaneseParser } from "budoux";

const parser = loadDefaultJapaneseParser();

/**
 * Japanese text that wraps only between phrases (文節), so phones never show
 * breaks like 「活/かせる」 or 「会員登/録」.
 *
 * BudouX splits the text into phrases on the server and <wbr> marks the
 * allowed break points; the `.jp` class (globals.css) forbids breaking
 * anywhere else. Server components only.
 */
export default function Jp({ children }: { children: string }) {
  const phrases = parser.parse(children);
  return (
    <span className="jp">
      {phrases.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {p}
        </Fragment>
      ))}
    </span>
  );
}
