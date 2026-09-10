import { enrichCodingProfiles } from "@/lib/coding-stats";
import { requireUser, unauthorized } from "@/lib/session";
import type { CodingProfiles } from "@/lib/types";

export async function POST(request: Request) {
  try {
    await requireUser();
    const profiles = (await request.json()) as CodingProfiles;
    const enriched = await enrichCodingProfiles(profiles);
    return Response.json(enriched);
  } catch {
    return unauthorized();
  }
}
