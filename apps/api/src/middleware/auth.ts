import type { MiddlewareHandler } from "hono";

export type AuthContext = {
  Variables: {
    userId: string;
  };
};

export const bearerAuth: MiddlewareHandler<AuthContext> = async (c, next) => {
  const header = c.req.header("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return c.json({ error: "missing or malformed Authorization header" }, 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    return c.json({ error: "empty bearer token" }, 401);
  }

  c.set("userId", `user:${token}`);
  await next();
};
