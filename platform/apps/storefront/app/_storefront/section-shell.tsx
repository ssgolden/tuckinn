import type { ReactNode } from "react";

type SectionShellProps = {
  title: string;
  eyebrow?: string;
  body?: string;
  className?: string;
  children: ReactNode;
};

export function SectionShell({
  title,
  eyebrow,
  body,
  className,
  children
}: SectionShellProps) {
  return (
    <section className={className ? `content-panel ${className}` : "content-panel"} aria-label={eyebrow ? `${eyebrow}: ${title}` : title}>
      <div className="panel-head">
        <div>
          {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {body ? <p className="section-body-copy">{body}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
