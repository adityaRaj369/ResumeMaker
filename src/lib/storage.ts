import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dir = path.join(process.cwd(), "storage", "pdfs");

export async function savePdf(id: string, pdf: Buffer) {
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${id}.pdf`);
  await writeFile(filePath, pdf);
  return `/api/resumes/${id}/pdf`;
}

export async function readPdf(id: string) {
  return readFile(path.join(dir, `${id}.pdf`));
}
