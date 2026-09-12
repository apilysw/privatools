import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  const format = request.nextUrl.searchParams.get("format");

  const wantsMarkdown =
    accept.includes("text/markdown") ||
    contentType.includes("text/markdown") ||
    format === "md" ||
    format === "markdown";

  if (wantsMarkdown && !request.nextUrl.pathname.endsWith(".md") && !request.nextUrl.pathname.startsWith("/_next/")) {
    let cleanPath = request.nextUrl.pathname.replace(/\/+$/, "");
    if (cleanPath === "") {
      cleanPath = "/index";
    }

    const candidateRelPaths = [
      `${cleanPath}.md`,
      `${cleanPath}/index.md`,
      cleanPath === "/index" ? "/llms.md" : null,
    ].filter(Boolean) as string[];

    for (const rel of candidateRelPaths) {
      const filePath = path.join(process.cwd(), "public", rel.startsWith("/") ? rel.slice(1) : rel);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return new NextResponse(content, {
          status: 200,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Vary": "Accept, Content-Type",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }
  }

  return NextResponse.next();
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons).*)",
  ],
};
