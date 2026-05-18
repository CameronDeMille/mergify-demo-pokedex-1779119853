import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Pokemon } from "@pokedex/types";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, "../../../../data/pokemon.json");

const raw = JSON.parse(readFileSync(dataPath, "utf8")) as Omit<Pokemon, "ownerId">[];

export const pokemon: Pokemon[] = raw.map((p) => ({ ...p, ownerId: "system" }));
