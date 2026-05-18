import { Pokemon, type FavoriteRecord } from "@pokedex/types";
import { Hono } from "hono";
import { pokemon } from "../data/pokemon.js";
import { sortPokemon } from "../data/sort.js";

export type ListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Pokemon[];
  // Reserved so the favorites slice can attach per-item favorite metadata
  // without changing the response shape again.
  favorites?: FavoriteRecord[];
};

export const listRoute = new Hono();

listRoute.get("/pokemon", (c) => {
  const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
  const pageSize = Math.max(
    1,
    Math.min(100, Number(c.req.query("pageSize") ?? 20) || 20),
  );

  const all = sortPokemon(pokemon, "id");
  const total = all.length;
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  const body: ListResponse = { page, pageSize, total, items };
  return c.json(body);
});
