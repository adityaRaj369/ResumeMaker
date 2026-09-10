import type { ResumeContent } from "@/lib/types";

/** Instant HTML paper preview — mirrors form edits without waiting for LaTeX compile. */
export function LiveResumePreview({ content }: { content: ResumeContent }) {
  const links = [
    content.email,
    content.phone,
    content.location,
    content.linkedinUrl,
    content.githubUrl,
    content.portfolioUrl,
  ].filter(Boolean);

  return (
    <article className="min-h-[780px] bg-white px-6 py-5 text-[#111] sm:px-7 sm:py-6">
      <header className="border-b border-[#222] pb-2.5">
        <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight text-black">
          {content.fullName?.trim() || "Your Name"}
        </h1>
        {links.length > 0 && (
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#444]">
            {links.join("  ·  ")}
          </p>
        )}
      </header>

      {content.summary?.trim() ? (
        <Section title="Summary">
          <p className="text-[11.5px] leading-relaxed text-[#1a1a1a]">
            <RichText text={content.summary} />
          </p>
        </Section>
      ) : null}

      {content.experience.length > 0 ? (
        <Section title="Experience">
          {content.experience.map((job, i) => (
            <div key={i} className="mb-2.5 last:mb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-[12px] font-semibold text-black">
                  {job.title || "Role"}
                  {job.company ? (
                    <span className="font-normal text-[#222]"> — {job.company}</span>
                  ) : null}
                </p>
                <p className="text-[11px] tabular-nums text-[#444]">
                  {[job.startDate, job.endDate || (job.startDate ? "Present" : "")]
                    .filter(Boolean)
                    .join(" – ")}
                </p>
              </div>
              {job.location ? <p className="text-[11px] text-[#555]">{job.location}</p> : null}
              <ul className="mt-1 list-disc space-y-0.5 pl-3.5 text-[11.5px] leading-snug text-[#1a1a1a]">
                {job.bullets.filter((b) => b.trim()).map((b, j) => (
                  <li key={j}>
                    <RichText text={b} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      ) : null}

      {content.education.length > 0 ? (
        <Section title="Education">
          {content.education.map((ed, i) => (
            <div key={i} className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 last:mb-0">
              <p className="text-[12px] font-semibold text-black">
                {ed.school || "School"}
                {ed.degree ? <span className="font-normal text-[#222]"> — {ed.degree}</span> : null}
                {ed.field ? <span className="font-normal text-[#444]">, {ed.field}</span> : null}
              </p>
              <p className="text-[11px] text-[#555]">
                {[ed.startDate, ed.endDate].filter(Boolean).join(" – ")}
                {ed.gpa ? ` · GPA ${ed.gpa}` : ""}
              </p>
            </div>
          ))}
        </Section>
      ) : null}

      {(content.projects?.length ?? 0) > 0 ? (
        <Section title="Projects">
          {content.projects!.map((p, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-[12px] font-semibold text-black">
                {p.name}
                {p.tech?.length ? (
                  <span className="ml-1 font-normal text-[#555]">({p.tech.join(", ")})</span>
                ) : null}
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-3.5 text-[11.5px] leading-snug text-[#1a1a1a]">
                {p.bullets.filter((b) => b.trim()).map((b, j) => (
                  <li key={j}>
                    <RichText text={b} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      ) : null}

      {(content.certifications?.length ?? 0) > 0 ? (
        <Section title="Certifications">
          <ul className="space-y-1 text-[12.5px] text-[#1a1a1a]">
            {content.certifications!.map((c, i) => (
              <li key={i}>
                <span className="font-semibold">{c.name}</span>
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.date ? ` (${c.date})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {content.skills.length > 0 ? (
        <Section title="Skills">
          <p className="text-[11.5px] leading-relaxed text-[#1a1a1a]">
            <RichText text={content.skills.join(" · ")} />
          </p>
        </Section>
      ) : null}

      {!content.summary &&
        !content.experience.length &&
        !content.education.length &&
        !content.skills.length && (
          <p className="mt-10 text-center text-sm text-[#666]">
            Fill in the form on the right — this page updates instantly.
          </p>
        )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="mb-1.5 border-b border-[#bbb] pb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Renders **bold** markers from the form. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = /^\*\*([^*]+)\*\*$/.exec(part);
        if (bold) {
          return (
            <strong key={i} className="font-bold text-black">
              {bold[1]}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
