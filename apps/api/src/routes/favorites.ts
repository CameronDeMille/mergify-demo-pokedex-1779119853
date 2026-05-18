import { Hono } from "hono";
import type { FavoriteRecord } from "@pokedex/types";
import { bearerAuth } from "../middleware/auth.js";

const store = new Map<string, FavoriteRecord[]>();

function add(record: FavoriteRecord): void {
  const current = store.get(record.userId) ?? [];
  if (!current.some((r) => r.pokemonId === record.pokemonId)) {
    current.push(record);
    store.set(record.userId, current);
  }
}

export function _resetFavorites(): void {
  store.clear();
}

export const favoritesRoute = new Hono<{
  Variables: { userId: string };
}>();

favoritesRoute.post("/favorites", bearerAuth, async (c) => {
  let body: { pokemonId?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid json body" }, 400);
  }

  const pokemonId = Number(body.pokemonId);
  if (!Number.isFinite(pokemonId) || pokemonId <= 0) {
    return c.json({ error: "pokemonId must be a positive number" }, 400);
  }

  const userId = c.get("userId");
  const record: FavoriteRecord = {
    userId,
    pokemonId: Math.floor(pokemonId),
    createdAt: new Date().toISOString(),
  };
  add(record);
  return c.json(record, 201);
});

favoritesRoute.get("/favorites/:userId", (c) => {
  const userId = c.req.param("userId");
  return c.json(store.get(userId) ?? []);
});
