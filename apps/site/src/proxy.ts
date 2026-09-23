import { NextResponse, type NextRequest } from "next/server";
import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { DOCS_CONTENT_ROUTE, DOCS_ROUTE } from "@/lib/shared";

const docs = rewritePath(`${DOCS_ROUTE}{/*path}`, `${DOCS_CONTENT_ROUTE}{/*path}/content.md`);
const suffix = rewritePath(`${DOCS_ROUTE}{/*path}.md`, `${DOCS_CONTENT_ROUTE}{/*path}/content.md`);

export default function proxy(request: NextRequest): NextResponse {
  const result = suffix.rewrite(request.nextUrl.pathname);
  if (result) {
    return NextResponse.rewrite(new URL(result, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = docs.rewrite(request.nextUrl.pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl), {
        // this URL has two representations, selected by `Accept`
        headers: { Vary: "Accept" },
      });
    }
  }

  return NextResponse.next();
}
