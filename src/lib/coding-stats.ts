import type { CodingProfiles } from "@/lib/types";

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "ResumeForge/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed ${res.status}`);
  return res.json();
}

export async function enrichCodingProfiles(profiles: CodingProfiles): Promise<CodingProfiles> {
  const stats = { ...(profiles.stats ?? {}) };

  const cf = profiles.codeforces?.split("/").filter(Boolean).at(-1);
  if (cf) {
    try {
      const data = await fetchJson(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cf)}`);
      const user = data?.result?.[0];
      if (user) {
        stats.codeforcesRating = user.rating ?? user.maxRating;
        stats.codeforcesRank = user.rank ?? user.maxRank;
      }
    } catch {
      // public API optional
    }
  }

  const lc = profiles.leetcode?.split("/").filter(Boolean).at(-1);
  if (lc) {
    try {
      const data = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "ResumeForge/1.0" },
        body: JSON.stringify({
          query:
            "query ($username: String!) { matchedUser(username: $username) { submitStatsGlobal { acSubmissionNum { difficulty count } } } }",
          variables: { username: lc },
        }),
      });
      const json = await data.json();
      const all = json?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum?.find(
        (row: { difficulty: string }) => row.difficulty === "All",
      );
      if (all?.count) stats.leetcodeSolved = all.count;
    } catch {
      // ignore
    }
  }

  return { ...profiles, stats };
}
