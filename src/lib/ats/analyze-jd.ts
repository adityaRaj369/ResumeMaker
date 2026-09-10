import type { JdAnalysis } from "@/lib/types";
import { normalizeKeyword, unique } from "@/lib/utils";

/** Common tech / role terms used by real ATS keyword filters (Workday/Taleo-style exact match). */
const SKILL_LEXICON = [
  "TypeScript", "JavaScript", "Python", "Java", "Go", "Golang", "Rust", "C++", "C#", "Kotlin", "Swift",
  "React", "Next.js", "Angular", "Vue", "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI",
  "Spring", "Rails", ".NET", "GraphQL", "REST", "gRPC",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "RabbitMQ", "SQLite", "SQL",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD", "Jenkins", "GitHub Actions",
  "Linux", "Git", "Microservices", "System Design", "Distributed Systems", "Machine Learning", "PyTorch",
  "TensorFlow", "Pandas", "Spark", "Airflow", "dbt", "Snowflake", "BigQuery", "Tableau", "Power BI",
  "Figma", "Product Management", "Agile", "Scrum", "Jira", "A/B Testing", "SEO", "Analytics",
  "Communication", "Leadership", "Problem Solving", "Ownership",
];

const SYNONYMS: Record<string, string[]> = {
  javascript: ["js", "ecmascript"],
  typescript: ["ts"],
  "node.js": ["nodejs", "node"],
  "next.js": ["nextjs", "next"],
  kubernetes: ["k8s", "kube"],
  postgresql: ["postgres", "psql"],
  "ci/cd": ["cicd", "continuous integration", "continuous delivery"],
  "machine learning": ["ml", "deep learning"],
  golang: ["go"],
  "c++": ["cpp", "cplusplus"],
  "c#": ["csharp", "c sharp"],
  amazon: ["aws"],
  "google cloud": ["gcp"],
};

/**
 * Extract JD requirements without inventing skills.
 * Prefer AI when available; this is the deterministic fallback used by the public checker.
 */
export function analyzeJobDescriptionHeuristic(jd: string): JdAnalysis {
  const text = jd.replace(/\r/g, "\n");
  const lower = text.toLowerCase();

  const foundSkills = SKILL_LEXICON.filter((skill) => {
    const n = normalizeKeyword(skill);
    if (n.length <= 2) return new RegExp(`\\b${escapeReg(n)}\\b`, "i").test(lower);
    return lower.includes(n);
  });

  // Capitalized multi-word phrases often signal tools/products in JDs
  const phraseHits = Array.from(text.matchAll(/\b([A-Z][A-Za-z0-9+#./-]{1,}(?:\s+[A-Z][A-Za-z0-9+#./-]{1,}){0,3})\b/g))
    .map((m) => m[1].trim())
    .filter((p) => p.length >= 2 && p.length <= 40)
    .filter((p) => !/^(The|And|Or|With|For|Our|You|We|This|That|Will|Are|Is)$/i.test(p));

  const mustSection = sliceSection(text, /(requirements|must[- ]have|what you.?ll need|qualifications|required)/i);
  const niceSection = sliceSection(text, /(nice[- ]to[- ]have|preferred|bonus|good to have)/i);

  const fromMust = extractListedItems(mustSection).concat(
    foundSkills.filter((s) => mustSection.toLowerCase().includes(s.toLowerCase())),
  );
  const fromNice = extractListedItems(niceSection);

  let mustHaveKeywords = unique(
    (fromMust.length ? fromMust : foundSkills.slice(0, 10)).map((k) => k.trim()).filter(Boolean),
  ).slice(0, 14);

  let niceToHaveKeywords = unique(
    [...fromNice, ...foundSkills.slice(mustHaveKeywords.length), ...phraseHits]
      .map((k) => k.trim())
      .filter((k) => k && !mustHaveKeywords.some((m) => normalizeKeyword(m) === normalizeKeyword(k))),
  ).slice(0, 16);

  if (!mustHaveKeywords.length && foundSkills.length) {
    mustHaveKeywords = foundSkills.slice(0, 8);
    niceToHaveKeywords = foundSkills.slice(8, 16);
  }

  const seniorityLevel = /staff|principal|distinguished/i.test(jd)
    ? "staff"
    : /senior|sr\./i.test(jd)
      ? "senior"
      : /intern|junior|entry/i.test(jd)
        ? "junior"
        : "mid";

  const responsibilities = extractListedItems(
    sliceSection(text, /(responsibilities|what you.?ll do|about the role|the role)/i),
  ).slice(0, 10);

  return {
    hardSkills: unique(foundSkills).slice(0, 24),
    softSkills: ["Communication", "Leadership", "Problem Solving", "Ownership"].filter((s) =>
      lower.includes(s.toLowerCase()),
    ),
    tools: foundSkills.filter((k) =>
      /aws|gcp|azure|docker|kubernetes|jenkins|jira|git|terraform|figma|tableau/i.test(k),
    ),
    seniorityLevel,
    keyResponsibilities: responsibilities,
    mustHaveKeywords,
    niceToHaveKeywords,
  };
}

export function keywordVariants(keyword: string): string[] {
  const base = normalizeKeyword(keyword);
  const extras = SYNONYMS[base] ?? [];
  const collapsed = base.replace(/[./\s-]+/g, "");
  return unique([base, ...extras, collapsed].filter((v) => v.length >= 2));
}

/** True if resume text contains keyword or a known synonym (exact / word-boundary when short). */
export function resumeHasKeyword(resumeLower: string, keyword: string): boolean {
  for (const variant of keywordVariants(keyword)) {
    if (variant.length <= 3) {
      if (new RegExp(`\\b${escapeReg(variant)}\\b`, "i").test(resumeLower)) return true;
    } else if (resumeLower.includes(variant)) {
      return true;
    }
  }
  return false;
}

function escapeReg(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sliceSection(text: string, heading: RegExp): string {
  const match = heading.exec(text);
  if (!match || match.index == null) return "";
  const start = match.index;
  const rest = text.slice(start);
  const next = rest.search(/\n\s*(requirements|responsibilities|qualifications|benefits|about |what you|nice|preferred|must)\b/i);
  // Skip the matched heading itself for "next" — find subsequent heading after first line
  const afterFirstLine = rest.indexOf("\n");
  const body = afterFirstLine >= 0 ? rest.slice(afterFirstLine) : rest;
  const cut = body.search(/\n\s*[A-Z][A-Za-z /&]{3,40}\n/);
  if (next > 40) return rest.slice(0, next);
  if (cut > 40) return rest.slice(0, afterFirstLine + cut);
  return rest.slice(0, 1200);
}

function extractListedItems(section: string): string[] {
  if (!section) return [];
  const lines = section.split(/\n+/);
  const items: string[] = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^[\s•\-*–—\d.)]+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length < 2 || cleaned.length > 80) continue;
    if (/^(requirements|qualifications|responsibilities|preferred|must)/i.test(cleaned)) continue;
    // Prefer short skill-like tokens
    if (/,/.test(cleaned) && cleaned.length < 60) {
      items.push(...cleaned.split(",").map((s) => s.trim()).filter((s) => s.length >= 2 && s.length <= 40));
    } else if (cleaned.split(" ").length <= 6) {
      items.push(cleaned);
    }
  }
  return unique(items).slice(0, 20);
}
