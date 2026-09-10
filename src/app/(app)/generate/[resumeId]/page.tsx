import { GenerateView } from "@/components/generate/generate-view";

export default async function GeneratePage({
  params,
  searchParams,
}: {
  params: Promise<{ resumeId: string }>;
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { resumeId } = await params;
  const { jobId } = await searchParams;
  return <GenerateView resumeId={resumeId} jobId={jobId || resumeId} />;
}
