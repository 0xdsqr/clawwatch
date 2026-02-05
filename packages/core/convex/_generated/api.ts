import { anyApi } from "convex/server";

// Fallback API for builds that don't run Convex codegen.
// Running `npx convex dev --once` will generate a typed API file.
export const api = anyApi;
export const internal = anyApi;
