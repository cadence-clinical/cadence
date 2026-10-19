import { docsLlms } from "@/lib/source";

export const revalidate = false;

export function GET(): Response {
  return new Response(docsLlms.index());
}
