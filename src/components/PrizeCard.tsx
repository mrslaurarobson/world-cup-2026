import type { ReactNode } from "react";

interface Props {
  emoji: string;
  title: string;
  prize: string;
  rule: string;
  children: ReactNode;
}

export default function PrizeCard({ emoji, title, prize, rule, children }: Props) {
  return (
    <section className="prize-card">
      <header className="prize-header">
        <span className="prize-emoji" aria-hidden="true">
          {emoji}
        </span>
        <div className="prize-heading">
          <h2>{title}</h2>
          <p className="prize-rule">{rule}</p>
        </div>
        <span className="prize-amount">{prize}</span>
      </header>
      <div className="prize-body">{children}</div>
    </section>
  );
}
