import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { flatNavItems } from "@/components/layout/nav";
import { routeTree } from "@/routeTree.gen";

function matchPath(path: string) {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  return router.matchRoutes(path);
}

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    expect(matchPath("/").at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches a page for every navigation entry", () => {
    for (const item of flatNavItems) {
      expect(matchPath(item.to).at(-1)?.routeId, `route ${item.to} should resolve`).not.toBe(rootRouteId);
    }
  });

  it("renders the dashboard inside the shared app layout", () => {
    const matched = matchPath("/");
    expect(matched.map((match) => match.routeId)).toContain("/_app");
  });
});
