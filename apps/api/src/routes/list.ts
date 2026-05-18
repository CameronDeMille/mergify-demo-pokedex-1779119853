import { Hono } from "hono";
import { Pokemon } from "@pokedex/types";
import { pokemon } from "../data/pokemon.js";
import { sortPokemon } from "../data/sort.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const listRoute = new Hono();

listRoute.get("/pokemon", (c) => {
  const pageRaw = Number(c.req.query("page") ?? "1");
  const sizeRaw = Number(c.req.query("pageSize") ?? String(DEFAULT_PAGE_SIZE));

  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(sizeRaw) && sizeRaw >= 1
    ? Math.min(Math.floor(sizeRaw), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const sorted: Pokemon[] = sortPokemon(pokemon, "id");
  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  const hasNext = start + pageSize < total;

  return c.json({
    items,
    page,
    pageSize,
    total,
    hasNext,
  });
});
