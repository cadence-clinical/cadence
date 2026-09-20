import { docsLlms } from "@/lib/source";

export const revalidate = false;

export async function GET(): Promise<Response> {
  return new Response(await docsLlms.full());
}
