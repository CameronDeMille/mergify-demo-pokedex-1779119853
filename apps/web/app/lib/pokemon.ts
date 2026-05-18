import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Pokemon } from "@pokedex/types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface PokemonPage {
  items: Pokemon[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}

function readAll(): Pokemon[] {
  const dataPath = resolve(process.cwd(), "../../data/pokemon.json");
  const raw = JSON.parse(readFileSync(dataPath, "utf8")) as Omit<Pokemon, "ownerId">[];
  return raw.map((p) => ({ ...p, ownerId: "system" }));
}

export function loadPokemon(): Pokemon[] {
  return readAll();
}

export function loadPokemonPage(page = 1, pageSize = DEFAULT_PAGE_SIZE): PokemonPage {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safeSize = Number.isFinite(pageSize) && pageSize >= 1
    ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const all = readAll().sort((a, b) => a.id - b.id);
  const start = (safePage - 1) * safeSize;
  const items = all.slice(start, start + safeSize);
  return {
    items,
    page: safePage,
    pageSize: safeSize,
    total: all.length,
    hasNext: start + safeSize < all.length,
  };
}
