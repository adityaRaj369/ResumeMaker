import type { ResumeContent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Variant = "jakes" | "sb2nov" | "modern" | "harvard" | "engineering" | "classic";

function variantFromSlug(slug?: string | null): Variant {
  const s = (slug || "jakes").toLowerCase();
  if (s.includes("harvard")) return "harvard";
  if (s.includes("sb2nov")) return "sb2nov";
  if (s.includes("modern") || s.includes("deedy")) return "modern";
  if (s.includes("engineering")) return "engineering";
  if (s.includes("ink") || s.includes("classic")) return "classic";
  return "jakes";
}

function ghost(text: string, fallback: string) {
  const t = text?.trim();
  return t ? t : fallback;
}

/**
 * Live paper for the editor — one field on the right maps to one block on the left.
 * Always renders the form’s rows (even when empty) so typing updates this page instantly.
 */
export function TemplateResumePreview({
  content,
  templateSlug,
  className,
}: {
  content: ResumeContent;
  templateSlug?: string | null;
  className?: string;
}) {
  const variant = variantFromSlug(templateSlug);
  const links = [
    content.email?.trim() || null,
    content.phone?.trim() || null,
    content.location?.trim() || null,
    content.linkedinUrl?.replace(/^https?:\/\//, "") || null,
    content.githubUrl?.replace(/^https?:\/\//, "") || null,
    content.portfolioUrl?.replace(/^https?:\/\//, "") || null,
  ].filter(Boolean) as string[];

  const skillsLines = [
    content.skillCategories?.languages?.length
      ? { label: "Languages", value: content.skillCategories.languages.join(", ") }
      : null,
    content.skillCategories?.frameworks?.length
      ? { label: "Frameworks", value: content.skillCategories.frameworks.join(", ") }
      : null,
    content.skillCategories?.tools?.length
      ? { label: "Tools", value: content.skillCategories.tools.join(", ") }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const flatSkills = content.skills?.filter(Boolean).join(" · ") || "";

  return (
    <article
      className={cn(
        "min-h-[720px] w-full bg-white text-[#111] shadow-none",
        variant === "jakes" && "px-7 py-6 font-[Times_New_Roman,Times,serif]",
        variant === "sb2nov" && "px-8 py-7 font-[Georgia,Times,serif]",
        variant === "modern" && "px-7 py-6 font-[Arial,Helvetica,sans-serif]",
        variant === "harvard" && "px-10 py-8 font-[Times_New_Roman,Times,serif]",
        variant === "engineering" && "px-6 py-5 font-[Arial,Helvetica,sans-serif] text-[12px]",
        variant === "classic" && "px-8 py-7 font-[Georgia,Times,serif]",
        className,
      )}
    >
      <header
        className={cn(
          "pb-2",
          variant === "jakes" && "border-b border-[#222] text-center",
          variant === "sb2nov" && "border-b-2 border-[#222]",
          variant === "modern" && "border-b border-[#333]",
          variant === "harvard" && "text-center",
          variant === "engineering" && "border-b border-[#111]",
          variant === "classic" && "border-b border-[#444] text-center",
        )}
      >
        <h1
          className={cn(
            "font-bold tracking-tight",
            content.fullName?.trim() ? "text-black" : "text-[#bbb]",
            variant === "jakes" && "text-[22px] uppercase tracking-[0.04em]",
            variant === "sb2nov" && "text-[24px]",
            variant === "modern" && "text-[20px] tracking-wide",
            variant === "harvard" && "text-[26px]",
            variant === "engineering" && "text-[18px]",
            variant === "classic" && "text-[22px]",
          )}
        >
          {ghost(content.fullName, "Your Name")}
        </h1>
        <p
          className={cn(
            "mt-1.5 text-[10px] leading-relaxed",
            links.length ? "text-[#333]" : "text-[#bbb]",
            variant === "jakes" && "text-center",
            variant === "harvard" && "text-center",
            variant === "classic" && "text-center",
          )}
        >
          {links.length ? links.join("  |  ") : "email  |  phone  |  location"}
        </p>
      </header>

      {(content.summary?.trim() || variant === "classic" || variant === "engineering" || variant === "harvard") && (
        <Section title="Summary" variant={variant}>
          <p className={cn("text-[11px] leading-relaxed", !content.summary?.trim() && "text-[#bbb]")}>
            {content.summary?.trim() ? (
              <Formatted text={content.summary} />
            ) : (
              "Add a short professional summary on the right"
            )}
          </p>
        </Section>
      )}

      <Section title="Experience" variant={variant}>
        {(content.experience.length ? content.experience : [{ company: "", title: "", location: "", startDate: "", endDate: "", bullets: [""] }]).map(
          (job, i) => {
            const hasTitle = Boolean(job.title?.trim() || job.company?.trim());
            const bullets = (job.bullets ?? []).filter((b) => b.trim());
            return (
              <div key={i} className="mb-2.5 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className={cn("text-[12px] font-bold", !hasTitle && "text-[#bbb]")}>
                    {variant === "jakes" ? (
                      <>
                        {ghost(job.title, "Job title")}
                        {job.company?.trim() ? `, ${job.company}` : hasTitle ? "" : ", Company"}
                      </>
                    ) : (
                      <>
                        {ghost(job.company, "Company")}
                        {job.title?.trim() ? ` — ${job.title}` : hasTitle ? "" : " — Job title"}
                      </>
                    )}
                  </p>
                  <p className={cn("text-[10px] tabular-nums", job.startDate?.trim() ? "text-[#444]" : "text-[#bbb]")}>
                    {job.startDate?.trim() || job.endDate?.trim()
                      ? [job.startDate, job.endDate || (job.startDate ? "Present" : "")].filter(Boolean).join(" – ")
                      : "Start – End"}
                  </p>
                </div>
                {job.location?.trim() ? (
                  <p className="text-[10px] italic text-[#555]">{job.location}</p>
                ) : null}
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-snug">
                  {(bullets.length ? bullets : ["Describe an impact bullet"]).map((b, j) => (
                    <li key={j} className={bullets.length ? undefined : "text-[#bbb]"}>
                      {bullets.length ? <Formatted text={b} /> : b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          },
        )}
      </Section>

      <Section title="Education" variant={variant}>
        {(content.education.length ? content.education : [{ school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" }]).map(
          (ed, i) => {
            const filled = Boolean(ed.school?.trim());
            const highlights = (ed.highlights ?? []).filter((h) => h.trim());
            return (
              <div key={i} className="mb-2 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className={cn("text-[12px] font-bold", !filled && "text-[#bbb]")}>
                    {ghost(ed.school, "School / University")}
                    {ed.degree || ed.field ? (
                      <span className="font-normal">
                        {" "}
                        — {[ed.degree, ed.field].filter(Boolean).join(" in ")}
                      </span>
                    ) : filled ? null : (
                      <span className="font-normal"> — Degree</span>
                    )}
                    {ed.gpa ? <span className="font-normal text-[#555]"> · GPA {ed.gpa}</span> : null}
                  </p>
                  <p className={cn("text-[10px]", ed.startDate || ed.endDate ? "text-[#555]" : "text-[#bbb]")}>
                    {[ed.startDate, ed.endDate].filter(Boolean).join(" – ") || "Years"}
                  </p>
                </div>
                {ed.location?.trim() ? (
                  <p className="text-[10px] italic text-[#555]">{ed.location}</p>
                ) : null}
                {highlights.length ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-snug">
                    {highlights.map((h, j) => (
                      <li key={j}>
                        <Formatted text={h} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          },
        )}
      </Section>

      {(variant === "jakes" ||
        variant === "sb2nov" ||
        variant === "modern" ||
        variant === "engineering" ||
        (content.projects?.length ?? 0) > 0) && (
        <Section title="Projects" variant={variant}>
          {(content.projects?.length
            ? content.projects
            : [{ name: "", description: "", bullets: [""], link: "", tech: [] as string[] }]
          ).map((p, i) => {
            const bullets = (p.bullets ?? []).filter((b) => b.trim());
            const filled = Boolean(p.name?.trim());
            return (
              <div key={i} className="mb-2 last:mb-0">
                <p className={cn("text-[12px] font-bold", !filled && "text-[#bbb]")}>
                  {ghost(p.name, "Project name")}
                  {p.tech?.length ? (
                    <span className="font-normal text-[#555]"> | {p.tech.join(", ")}</span>
                  ) : null}
                </p>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px]">
                  {(bullets.length ? bullets : ["What you built"]).map((b, j) => (
                    <li key={j} className={bullets.length ? undefined : "text-[#bbb]"}>
                      {bullets.length ? <Formatted text={b} /> : b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Section>
      )}

      <Section title="Technical Skills" variant={variant}>
        {skillsLines.length || flatSkills ? (
          skillsLines.length ? (
            <div className="space-y-0.5 text-[11px]">
              {skillsLines.map((row) => (
                <p key={row.label}>
                  <strong>{row.label}:</strong> {row.value}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[11px]">{flatSkills}</p>
          )
        ) : (
          <p className="text-[11px] text-[#bbb]">Add languages, frameworks, and tools on the right</p>
        )}
      </Section>

      {(content.certifications?.length ?? 0) > 0 ? (
        <Section title="Certifications" variant={variant}>
          <ul className="space-y-0.5 text-[11px]">
            {content.certifications!.map((c, i) => (
              <li key={i}>
                <strong>{c.name || "Certification"}</strong>
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.date ? ` (${c.date})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}

function Section({
  title,
  children,
  variant,
}: {
  title: string;
  children: React.ReactNode;
  variant: Variant;
}) {
  return (
    <section className="mt-3.5">
      <h2
        className={cn(
          "mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black",
          variant === "jakes" && "border-b border-[#999] pb-0.5",
          variant === "sb2nov" && "border-b-2 border-black pb-0.5",
          variant === "modern" && "border-b border-[#ccc] pb-0.5 tracking-[0.16em]",
          variant === "harvard" && "border-b border-black pb-0.5 uppercase",
          variant === "engineering" && "border-b border-black pb-0.5",
          variant === "classic" && "border-b border-[#666] pb-0.5",
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Formatted({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-bold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("__")) {
      nodes.push(
        <span key={key++} className="underline">
          {token.slice(2, -2)}
        </span>,
      );
    } else {
      nodes.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
