import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Pokemon } from "@pokedex/types";

export function loadPokemon(): Pokemon[] {
  const dataPath = resolve(process.cwd(), "../../data/pokemon.json");
  const all = JSON.parse(readFileSync(dataPath, "utf8")) as Pokemon[];
  return [...all].sort((a, b) => a.id - b.id);
}

export function loadPokemonPage(
  page: number,
  pageSize: number,
): { items: Pokemon[]; total: number } {
  const all = loadPokemon();
  const start = (page - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), total: all.length };
}
