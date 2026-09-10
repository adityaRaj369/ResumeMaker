import { emitJobEvent, onJobEvent } from "@/lib/jobs/queue";

const buffers = new Map<string, unknown[]>();

export function pushJobEvent(jobId: string, event: unknown) {
  const list = buffers.get(jobId) ?? [];
  list.push(event);
  buffers.set(jobId, list);
  emitJobEvent(jobId, event);
}

export function getJobBuffer(jobId: string) {
  return buffers.get(jobId) ?? [];
}

export { onJobEvent };
