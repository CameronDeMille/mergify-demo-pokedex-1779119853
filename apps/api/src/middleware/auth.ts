import type { MiddlewareHandler } from "hono";

export const DEFAULT_TOKEN = "demo-token";

export function getAuthToken(): string {
  return process.env.AUTH_TOKEN ?? DEFAULT_TOKEN;
}

export const bearerAuth: MiddlewareHandler<{
  Variables: { userId: string };
}> = async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return c.json({ error: "missing bearer token" }, 401);
  }

  if (token !== getAuthToken()) {
    return c.json({ error: "invalid token" }, 401);
  }

  const userId = c.req.header("x-user-id");
  if (!userId) {
    return c.json({ error: "missing x-user-id header" }, 401);
  }

  c.set("userId", userId);
  await next();
};
