import type { Pokemon } from "@pokedex/types";

export type SortKey = "id" | "asc";

export function sortPokemon(items: Pokemon[], key: SortKey = "id"): Pokemon[] {
  const copy = [...items];
  if (key === "asc") {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy.sort((a, b) => a.id - b.id);
}
