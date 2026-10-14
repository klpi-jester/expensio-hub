import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cloudflare/OpenNext build config for Expensio Hub.
//
// This app renders dynamically (cacheComponents + PPR + `await connection()`),
// so there is no cross-isolate ISR to share. We opt into the no-op "dummy"
// incremental/tag caches, which:
//   1. removes the OpenNext "no cache configured / use Durable Objects" build warning, and
//   2. avoids needing Durable Object bindings in wrangler.jsonc.
//
// If you later add ISR/static revalidated routes, swap these for the default
// (Durable Object) caches and add the corresponding `durable_objects` bindings.
export default defineCloudflareConfig({
  incrementalCache: "dummy",
  tagCache: "dummy",
});
