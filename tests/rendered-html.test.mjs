import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the JustEnough starter shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>JustEnough — pick the model, effort, and budget<\/title>/i);
  assert.match(html, /No smarter than necessary/);
  assert.match(html, /Find just enough/);
  assert.match(html, /Candidate frontier/);
  assert.match(html, /React · Vinext · Cloudflare Workers/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("removes disposable preview scaffolding and wires the selected stack", async () => {
  const [packageJson, providers, shell, viteConfig] = await Promise.all([
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL("app/providers.tsx", projectRoot), "utf8"),
    readFile(new URL("app/just-enough-shell.tsx", projectRoot), "utf8"),
    readFile(new URL("vite.config.ts", projectRoot), "utf8"),
  ]);

  assert.match(packageJson, /"@tanstack\/react-query"/);
  assert.match(packageJson, /"@radix-ui\/react-tabs"/);
  assert.match(packageJson, /"lucide-react"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(providers, /QueryClientProvider/);
  assert.match(shell, /@radix-ui\/react-tabs/);
  assert.match(shell, /<svg/);
  assert.match(viteConfig, /vinext\(\)/);
  assert.match(viteConfig, /cloudflare\(/);

  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});
