import type { AIProvider } from "@/lib/ai/provider";
import type { JdAnalysis, ResumeContent, RewriteResult } from "@/lib/types";
import { normalizeKeyword } from "@/lib/utils";

function extractKeywords(jd: string): string[] {
  const known = [
    "TypeScript",
    "JavaScript",
    "Python",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "Prisma",
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "GraphQL",
    "REST",
    "system design",
    "machine learning",
    "SQL",
    "Redis",
    "Kafka",
    "Go",
    "Java",
    "Swift",
    "Figma",
    "product strategy",
  ];
  const found = known.filter((k) => jd.toLowerCase().includes(k.toLowerCase()));
  const extras = Array.from(jd.matchAll(/\b([A-Z][A-Za-z0-9.+#]{2,24})\b/g))
    .map((m) => m[1])
    .filter((word) => !["The", "This", "You", "Our", "And"].includes(word));
  return Array.from(new Set([...found, ...extras])).slice(0, 24);
}

function reorderSkills(content: ResumeContent, keywords: string[]): ResumeContent {
  const hay = keywords.map(normalizeKeyword);
  const score = (skill: string) => (hay.some((k) => normalizeKeyword(skill).includes(k) || k.includes(normalizeKeyword(skill))) ? 0 : 1);
  const skills = [...(content.skills ?? [])].sort((a, b) => score(a) - score(b));
  const sortCat = (items: string[] = []) => [...items].sort((a, b) => score(a) - score(b));
  return {
    ...content,
    skills,
    skillCategories: content.skillCategories
      ? {
          languages: sortCat(content.skillCategories.languages),
          frameworks: sortCat(content.skillCategories.frameworks),
          tools: sortCat(content.skillCategories.tools),
        }
      : content.skillCategories,
  };
}

function tailorBullets(bullets: string[], keywords: string[]) {
  const hay = keywords.map(normalizeKeyword);
  return [...bullets].sort((a, b) => {
    const as = hay.filter((k) => normalizeKeyword(a).includes(k)).length;
    const bs = hay.filter((k) => normalizeKeyword(b).includes(k)).length;
    return bs - as;
  });
}

export function createMockProvider(): AIProvider {
  return {
    id: "mock",
    async analyzeJobDescription(jd) {
      const keywords = extractKeywords(jd);
      const analysis: JdAnalysis = {
        hardSkills: keywords.slice(0, 10),
        softSkills: ["communication", "ownership", "collaboration"].filter((s) =>
          jd.toLowerCase().includes(s),
        ),
        tools: keywords.filter((k) => /aws|docker|git|jira|figma|kubernetes|redis/i.test(k)),
        seniorityLevel: /senior|staff|principal/i.test(jd)
          ? "senior"
          : /intern|junior|new grad/i.test(jd)
            ? "junior"
            : "mid",
        keyResponsibilities: jd
          .split(/[\n•-]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 28)
          .slice(0, 6),
        mustHaveKeywords: keywords.slice(0, 8),
        niceToHaveKeywords: keywords.slice(8, 16),
      };
      return analysis;
    },
    async rewriteResume({ profile, analysis, match }) {
      const keywords = [...analysis.mustHaveKeywords, ...analysis.hardSkills];
      const reordered = reorderSkills(profile, keywords);
      const result: RewriteResult = {
        content: {
          ...reordered,
          summary: reordered.summary,
          experience: (reordered.experience ?? []).map((job) => ({
            ...job,
            bullets: tailorBullets(job.bullets ?? [], keywords).map((bullet) => {
              let next = bullet;
              if (/\bREST APIs?\b/i.test(next) && keywords.some((k) => /restful/i.test(k))) {
                next = next.replace(/\bREST APIs?\b/gi, "RESTful APIs");
              }
              if (/\bled\b/i.test(next) && /spearhead|lead/i.test(analysis.keyResponsibilities.join(" "))) {
                next = next.replace(/\bled\b/i, "spearheaded");
              }
              return next;
            }),
          })),
        },
        warnings: match.genuinelyMissing.map((keyword) => ({
          type: "missing_skill" as const,
          message: `This JD wants ${keyword} — it is not in your profile, so it was not added.`,
          evidence: keyword,
        })),
      };
      return result;
    },
  };
}
