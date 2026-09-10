import type { ResumeContent, SkillCategories, CodingProfiles } from "@/lib/types";
import type { User, UserProfile } from "@prisma/client";
import { blankResume } from "@/lib/sample-resume";
import { sampleContentForTemplate } from "@/lib/template-samples";

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * AI path only — real career profile facts. Never invents demo employers.
 */
export function profileToContent(user: User, profile: UserProfile | null): ResumeContent {
  const skills = asArray<string>(profile?.skills);
  const skillCategories = (profile?.skillCategories as SkillCategories | null) ?? {
    languages: [],
    frameworks: [],
    tools: [],
  };
  return {
    fullName: user.name || "",
    email: user.email || "",
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
    summary: profile?.summary ?? "",
    skills,
    skillCategories,
    experience: asArray(profile?.experience),
    education: asArray(profile?.education),
    projects: asArray(profile?.projects),
    certifications: asArray(profile?.certifications),
    codingProfiles: (profile?.codingProfiles as CodingProfiles | null) ?? {},
    targetRole: profile?.targetRole ?? "",
  };
}

export function isProfileReady(content: ResumeContent) {
  return Boolean(
    content.fullName?.trim() &&
      content.email?.trim() &&
      (content.experience.some((e) => e.company?.trim() || e.title?.trim()) ||
        content.projects?.some((p) => p.name?.trim()) ||
        content.education.some((e) => e.school?.trim())),
  );
}

/**
 * Manual path — open the published sample for that template so the form is
 * pre-filled with the same fields/values shown on the gallery resume.
 */
export function manualTemplateContent(templateSlug: string): ResumeContent {
  if (!templateSlug?.trim()) return blankResume();
  return sampleContentForTemplate(templateSlug);
}
