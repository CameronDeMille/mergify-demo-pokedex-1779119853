import type { Pokemon } from "@pokedex/types";

export type SortMode = "id" | "asc" | "desc" | "name";

export function sortPokemon(items: Pokemon[], mode: SortMode): Pokemon[] {
  const copy = [...items];
  switch (mode) {
    case "id":
      return copy.sort((a, b) => a.id - b.id);
    case "asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}
