import { Hono } from "hono";
import type { FavoriteRecord } from "@pokedex/types";
import { bearerAuth, type AuthContext } from "../middleware/auth.js";

const store = new Map<string, FavoriteRecord[]>();

export const favoritesRoute = new Hono<AuthContext>();

favoritesRoute.post("/favorites", bearerAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => null);
  const pokemonId = Number(body?.pokemonId);

  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    return c.json({ error: "pokemonId must be a positive integer" }, 400);
  }

  const existing = store.get(userId) ?? [];
  if (!existing.some((f) => f.pokemonId === pokemonId)) {
    existing.push({
      userId,
      pokemonId,
      createdAt: new Date().toISOString(),
    });
    store.set(userId, existing);
  }

  return c.json({ ok: true, favorites: existing }, 201);
});

favoritesRoute.get("/favorites/:userId", (c) => {
  const userId = c.req.param("userId");
  return c.json({ favorites: store.get(userId) ?? [] });
});

export const __resetFavorites = () => store.clear();
