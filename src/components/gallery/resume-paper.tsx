import type { ResumeContent } from "@/lib/types";

export type PaperStyle =
  | "jakes"
  | "sb2nov"
  | "faang"
  | "mckinsey"
  | "deedy"
  | "leet"
  | "latexcv"
  | "signal";

/** Map DB template slugs → original paper layouts. */
export function paperStyleFromSlug(slug?: string | null): PaperStyle {
  const s = (slug || "jakes").toLowerCase();
  if (s.includes("harvard") || (s.includes("classic") && !s.includes("engineering"))) return "mckinsey";
  if (s.includes("sb2nov")) return "sb2nov";
  if (s.includes("deedy")) return "deedy";
  if (s.includes("moderncv") || s.includes("modern")) return "faang";
  if (s.includes("engineeringclassic")) return "latexcv";
  if (s.includes("engineering")) return "leet";
  if (s.includes("ink") || s.includes("signal")) return "signal";
  if (s.includes("jakes")) return "jakes";
  return "jakes";
}

type PaperData = {
  name: string;
  contact: string;
  skills: string;
  summary: string;
  jobs: { title: string; company: string; loc: string; dates: string; bullets: string[] }[];
  education: { school: string; degree: string; dates: string };
  project: { name: string; stack: string; bullets: string[] };
  codingBadge: string;
};

const EMPTY: PaperData = {
  name: "Your Name",
  contact: "email@domain.com  ·  phone  ·  city",
  skills: "Add your skills on the right",
  summary: "",
  jobs: [
    {
      title: "Job title",
      company: "Company",
      loc: "Location",
      dates: "Start – End",
      bullets: ["Describe an impact bullet with a metric"],
    },
  ],
  education: {
    school: "School / University",
    degree: "Degree",
    dates: "Years",
  },
  project: {
    name: "Project name",
    stack: "Tech stack",
    bullets: ["What you built"],
  },
  codingBadge: "",
};

function plain(text: string) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/__([^_]+)__/g, "$1");
}

function hasRealContent(content: ResumeContent) {
  return Boolean(
    content.fullName?.trim() ||
      content.email?.trim() ||
      content.experience?.some((e) => e.company?.trim() || e.title?.trim() || e.bullets?.some((b) => b.trim())) ||
      content.education?.some((e) => e.school?.trim()) ||
      content.summary?.trim() ||
      content.skills?.length ||
      content.skillCategories?.languages?.length,
  );
}

function fromContent(content?: ResumeContent | null): PaperData {
  if (!content || !hasRealContent(content)) return EMPTY;
  const links = [
    content.location,
    content.email,
    content.phone,
    content.linkedinUrl?.replace(/^https?:\/\//, ""),
    content.githubUrl?.replace(/^https?:\/\//, ""),
  ].filter(Boolean);
  const skills =
    [
      ...(content.skillCategories?.languages ?? []),
      ...(content.skillCategories?.frameworks ?? []),
      ...(content.skillCategories?.tools ?? []),
    ].join(", ") || content.skills?.join(", ") || "";
  const ed = content.education?.find((e) => e.school?.trim()) ?? content.education?.[0];
  const proj = content.projects?.find((p) => p.name?.trim()) ?? content.projects?.[0];
  const stats = content.codingProfiles?.stats;
  const badgeParts = [
    stats?.leetcodeSolved ? `${stats.leetcodeSolved}+ LC` : null,
    stats?.codeforcesRank || (stats?.codeforcesRating ? `CF ${stats.codeforcesRating}` : null),
  ].filter(Boolean);
  const jobs = (content.experience ?? [])
    .filter((job) => job.title?.trim() || job.company?.trim() || job.bullets?.some((b) => b.trim()))
    .map((job) => ({
      title: job.title || "Job title",
      company: job.company || "Company",
      loc: job.location || "",
      dates: [job.startDate, job.endDate || (job.startDate ? "Present" : "")].filter(Boolean).join(" – "),
      bullets: (job.bullets ?? []).filter((b) => b.trim()).map(plain),
    }));

  return {
    name: content.fullName?.trim() || "Your Name",
    contact: links.length ? links.join("  ·  ") : "Add contact details",
    skills: skills || "Add skills",
    summary: content.summary?.trim() ? plain(content.summary) : "",
    jobs: jobs.length ? jobs : EMPTY.jobs,
    education: ed?.school?.trim()
      ? {
          school: ed.school,
          degree: [ed.degree, ed.field].filter(Boolean).join(" ") + (ed.gpa ? `, GPA ${ed.gpa}` : ""),
          dates: [ed.startDate, ed.endDate].filter(Boolean).join(" – "),
        }
      : EMPTY.education,
    project: proj?.name?.trim()
      ? {
          name: proj.name,
          stack: (proj.tech ?? []).join(", "),
          bullets: (proj.bullets ?? []).filter((b) => b.trim()).map(plain),
        }
      : EMPTY.project,
    codingBadge: badgeParts.length ? badgeParts.join(" · ") : "",
  };
}

/**
 * Original gallery/editor paper — letter aspect, clamp typography, full page visible.
 * Gallery: omit content (shows canonical sample). Editor: pass content so typing updates this same paper.
 */
export function ResumePaper({
  style,
  content,
  className = "",
}: {
  style: PaperStyle;
  content?: ResumeContent | null;
  className?: string;
}) {
  const data = fromContent(content);
  if (style === "jakes") return <Jakes data={data} className={className} />;
  if (style === "sb2nov") return <Sb2nov data={data} className={className} />;
  if (style === "faang") return <Faang data={data} className={className} />;
  if (style === "mckinsey") return <McKinsey data={data} className={className} />;
  if (style === "deedy") return <Deedy data={data} className={className} />;
  if (style === "leet") return <Leet data={data} className={className} />;
  if (style === "latexcv") return <LatexCv data={data} className={className} />;
  return <SignalPaper data={data} className={className} />;
}

function Shell({
  className,
  children,
  bg = "#FFFEF9",
}: {
  className?: string;
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div
      className={`resume-paper relative aspect-[8.5/11] w-full overflow-hidden text-[#111] select-none ${className ?? ""}`}
      style={{
        background: bg,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.5) inset, 0 40px 80px -40px rgba(0,0,0,0.55), 0 12px 24px -12px rgba(0,0,0,0.35)",
      }}
    >
      <div className="h-full w-full px-[7.5%] py-[6%] text-[clamp(7px,1.05vw,11px)] leading-[1.35]">
        {children}
      </div>
    </div>
  );
}

function Section({
  title,
  serif,
  children,
}: {
  title: string;
  serif?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-[1.1em]">
      <div
        className={`border-b border-[#111] pb-[0.15em] text-[1.05em] tracking-[0.08em] ${serif ? "font-serif" : "font-semibold uppercase"}`}
        style={serif ? { fontFamily: "Georgia, 'Times New Roman', serif" } : undefined}
      >
        {title}
      </div>
      <div className="mt-[0.55em]">{children}</div>
    </div>
  );
}

function Jakes({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className}>
      <div className="text-center">
        <div className="text-[1.85em] tracking-[0.12em]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {data.name.toUpperCase()}
        </div>
        <div className="mt-[0.35em] text-[0.78em] text-[#333]">{data.contact}</div>
      </div>
      <Section title="Education" serif>
        <div className="flex justify-between font-semibold">
          <span>{data.education.school}</span>
          <span className="font-normal text-[#333]">{data.education.dates}</span>
        </div>
        <div className="italic text-[#333]">{data.education.degree}</div>
      </Section>
      <Section title="Experience" serif>
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.75em]">
            <div className="flex justify-between font-semibold">
              <span>{job.title}</span>
              <span className="font-normal text-[#333]">{job.dates}</span>
            </div>
            <div className="italic text-[#333]">
              {job.company}
              {job.loc ? `, ${job.loc}` : ""}
            </div>
            <ul className="mt-[0.25em] list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Projects" serif>
        <div className="font-semibold">
          {data.project.name} | {data.project.stack}
        </div>
        <ul className="mt-[0.25em] list-disc pl-[1.1em]">
          {data.project.bullets.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      </Section>
      <Section title="Technical Skills" serif>
        <div>
          <span className="font-semibold">Languages & Tools: </span>
          {data.skills}
        </div>
      </Section>
    </Shell>
  );
}

function Sb2nov({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className} bg="#FAFAF8">
      <div className="text-center">
        <div className="text-[2em]" style={{ fontFamily: "Georgia, serif" }}>
          {data.name}
        </div>
        <div className="mt-[0.4em] text-[0.8em] text-[#444]">{data.contact}</div>
      </div>
      <Section title="Education" serif>
        <div className="flex justify-between font-semibold">
          <span>{data.education.school}</span>
          <span className="font-normal">{data.education.dates}</span>
        </div>
        <div>{data.education.degree}</div>
      </Section>
      <Section title="Experience" serif>
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.7em]">
            <div className="flex justify-between font-semibold">
              <span>{job.title}</span>
              <span className="font-normal">{job.dates}</span>
            </div>
            <div className="italic">
              {job.company}
              {job.loc ? ` — ${job.loc}` : ""}
            </div>
            <ul className="mt-[0.2em] list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Projects" serif>
        <div className="font-semibold">{data.project.name}</div>
        <ul className="list-disc pl-[1.1em]">
          {data.project.bullets.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      </Section>
      <Section title="Skills" serif>
        {data.skills}
      </Section>
    </Shell>
  );
}

function Faang({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className} bg="#F4F4F5">
      <div className="text-[2.35em] font-bold tracking-tight">{data.name}</div>
      <div className="mt-[0.25em] text-[0.78em] text-[#52525B]">{data.contact}</div>
      <div className="mt-[0.7em] h-[2px] bg-[#09090B]" />
      <Section title="Skills">
        <div className="text-[0.92em]">{data.skills}</div>
      </Section>
      <Section title="Experience">
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.7em]">
            <div className="flex justify-between">
              <span className="text-[1.05em] font-bold">{job.title}</span>
              <span className="text-[#52525B]">{job.dates}</span>
            </div>
            <div className="text-[#3F3F46]">
              {job.company}
              {job.loc ? ` · ${job.loc}` : ""}
            </div>
            <ul className="mt-[0.2em] list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Projects">
        <div className="font-bold">{data.project.name}</div>
        <ul className="list-disc pl-[1.1em]">
          {data.project.bullets.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      </Section>
      <Section title="Education">
        <div className="font-bold">{data.education.school}</div>
        <div className="text-[#3F3F46]">{data.education.degree}</div>
      </Section>
    </Shell>
  );
}

function McKinsey({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className} bg="#FFFDF8">
      <div className="text-center">
        <div className="text-[1.9em] font-bold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {data.name}
        </div>
        <div className="mx-auto mt-[0.4em] h-px w-[35%] bg-[#111]" />
        <div className="mt-[0.45em] text-[0.78em]">{data.contact}</div>
      </div>
      <Section title="Professional Experience">
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.7em]">
            <div className="flex justify-between font-bold">
              <span>
                {job.company} — {job.title}
              </span>
              <span className="font-normal">{job.dates}</span>
            </div>
            <ul className="mt-[0.2em] list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Education">
        <div className="flex justify-between font-bold">
          <span>{data.education.school}</span>
          <span className="font-normal">{data.education.dates}</span>
        </div>
        <div>{data.education.degree}</div>
      </Section>
      <Section title="Additional Information">
        <div>
          <span className="font-bold">Technical: </span>
          {data.skills}
        </div>
      </Section>
    </Shell>
  );
}

function Deedy({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className} bg="#F8FAFC">
      <div className="text-[2.1em] font-bold tracking-tight">{data.name}</div>
      <div className="mt-[0.2em] text-[0.78em] text-[#475569]">{data.contact}</div>
      <div className="mt-[0.65em] h-[3px] w-[28%] bg-[#0F172A]" />
      <Section title="Experience">
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.65em]">
            <div className="flex justify-between font-semibold">
              <span>{job.title}</span>
              <span className="font-normal text-[#64748B]">{job.dates}</span>
            </div>
            <div className="text-[#334155]">{job.company}</div>
            <ul className="mt-[0.15em] list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Education">
        <div className="font-semibold">{data.education.school}</div>
        <div>{data.education.degree}</div>
      </Section>
      <Section title="Skills">{data.skills}</Section>
    </Shell>
  );
}

function Leet({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className} bg="#F1F5F9">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[1.9em] font-bold">{data.name}</div>
          <div className="mt-[0.2em] text-[0.75em] text-[#475569]">{data.contact}</div>
        </div>
        <div className="rounded border border-[#CBD5E1] px-2 py-1 text-[0.7em] text-[#334155]">{data.codingBadge}</div>
      </div>
      <Section title="Technical Skills">{data.skills}</Section>
      <Section title="Experience">
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.65em]">
            <div className="flex justify-between font-semibold">
              <span>
                {job.title} @ {job.company}
              </span>
              <span className="font-normal">{job.dates}</span>
            </div>
            <ul className="list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Projects">
        <div className="font-semibold">
          {data.project.name} — {data.project.stack}
        </div>
        <ul className="list-disc pl-[1.1em]">
          {data.project.bullets.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      </Section>
      <Section title="Education">
        {data.education.school} · {data.education.degree}
      </Section>
    </Shell>
  );
}

function LatexCv({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className} bg="#FFFCF7">
      <div className="text-center">
        <div className="text-[2em] font-bold" style={{ fontFamily: "Georgia, serif" }}>
          {data.name}
        </div>
        <div className="mt-[0.35em] text-[0.78em]">{data.contact}</div>
      </div>
      <Section title="Summary" serif>
        {data.summary}
      </Section>
      <Section title="Experience" serif>
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.65em]">
            <div className="flex justify-between font-semibold">
              <span>{job.title}</span>
              <span className="font-normal">{job.dates}</span>
            </div>
            <div className="italic">{job.company}</div>
            <ul className="list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Education" serif>
        {data.education.school} — {data.education.degree}
      </Section>
      <Section title="Skills" serif>
        {data.skills}
      </Section>
    </Shell>
  );
}

function SignalPaper({ data, className }: { data: PaperData; className?: string }) {
  return (
    <Shell className={className} bg="#F4F4F5">
      <div className="text-[2.6em] font-bold leading-none tracking-tight">{data.name}</div>
      <div className="mt-[0.45em] text-[0.78em] text-[#52525B]">{data.contact}</div>
      <div className="mt-[0.7em] h-px bg-[#111]" />
      <Section title="Skills">{data.skills}</Section>
      <Section title="Experience">
        {data.jobs.map((job, i) => (
          <div key={`${job.title}-${i}`} className="mb-[0.65em]">
            <div className="text-[1.05em] font-bold">{job.title}</div>
            <div className="text-[#3F3F46]">
              {job.company} · {job.dates}
            </div>
            <ul className="list-disc pl-[1.1em]">
              {job.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Education">
        {data.education.school} · {data.education.degree}
      </Section>
    </Shell>
  );
}
