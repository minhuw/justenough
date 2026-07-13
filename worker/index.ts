/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  CORPUS: {
    get(key: string): Promise<{
      body: ReadableStream;
      httpEtag: string;
      writeHttpMetadata(headers: Headers): void;
    } | null>;
  };
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const CASE_ROUTE =
  /^\/api\/corpus\/(deepswe-v1\.1|terminal-bench-2\.1)\/([a-z0-9][a-z0-9._-]*)$/;

function apiError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "cache-control": "no-store" },
    },
  );
}

async function serveCorpusObject(
  request: Request,
  env: Env,
  key: string,
  cacheControl: string,
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const response = apiError("Method not allowed", 405);
    response.headers.set("allow", "GET, HEAD");
    return response;
  }

  if (!env.CORPUS) return apiError("Corpus binding unavailable", 503);

  const object = await env.CORPUS.get(key);
  if (!object) return apiError("Corpus object not found", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", cacheControl);
  headers.set("etag", object.httpEtag);
  headers.set("x-content-type-options", "nosniff");

  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/corpus/manifest") {
      return serveCorpusObject(
        request,
        env,
        "datasets/v1/manifest.json",
        "public, max-age=60, s-maxage=300",
      );
    }

    const caseRoute = url.pathname.match(CASE_ROUTE);
    if (caseRoute) {
      const [, benchmark, nativeId] = caseRoute;
      return serveCorpusObject(
        request,
        env,
        `datasets/v1/${benchmark}/${nativeId}.json`,
        "public, max-age=300, s-maxage=86400, immutable",
      );
    }

    if (url.pathname.startsWith("/api/corpus/")) {
      return apiError("Corpus object not found", 404);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
