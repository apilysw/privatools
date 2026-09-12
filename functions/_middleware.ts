interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
}

type PagesFunction<Env = unknown, P extends string = string, Data = Record<string, unknown>> = (
  context: EventContext<Env, P, Data>
) => Response | Promise<Response>;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const accept = request.headers.get("Accept") || "";
  const url = new URL(request.url);

  const wantsMarkdown =
    accept.includes("text/markdown") ||
    url.searchParams.get("format") === "md" ||
    url.searchParams.get("format") === "markdown";

  if (wantsMarkdown && !url.pathname.endsWith(".md") && !url.pathname.startsWith("/_next/")) {
    let cleanPath = url.pathname.replace(/\/+$/, "");
    if (cleanPath === "") {
      cleanPath = "/index";
    }

    const mdCandidates = [
      `${cleanPath}.md`,
      `${cleanPath}/index.md`,
      cleanPath === "/index" ? "/llms.md" : null,
    ].filter(Boolean) as string[];

    for (const cand of mdCandidates) {
      try {
        const mdUrl = new URL(cand, request.url);
        const mdRes = await env.ASSETS.fetch(new Request(mdUrl.toString(), request));
        if (mdRes && mdRes.status === 200) {
          const body = await mdRes.text();
          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": "text/markdown; charset=utf-8",
              "Vary": "Accept",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch {
        // Fall through to next candidate
      }
    }
  }

  const response = await next();

  // Ensure any directly requested .md file has Content-Type: text/markdown
  if (url.pathname.endsWith(".md")) {
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set("Vary", "Accept");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
};
