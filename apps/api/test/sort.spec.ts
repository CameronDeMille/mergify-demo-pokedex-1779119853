import { describe, it, expect } from "vitest";
import type { Pokemon } from "@pokedex/types";
import { sortPokemon } from "../src/data/sort.js";

const samples: Pokemon[] = [
  { id: 3, name: "Venusaur", types: ["Grass", "Poison"], sprite: "venusaur.png", ownerId: "system" },
  { id: 1, name: "Charmander", types: ["Fire"], sprite: "charmander.png", ownerId: "system" },
  { id: 2, name: "Bulbasaur", types: ["Grass", "Poison"], sprite: "bulbasaur.png", ownerId: "system" },
];

const expected: Pokemon[] = [
  { id: 1, name: "Charmander", types: ["Fire"], sprite: "charmander.png", ownerId: "system" },
  { id: 2, name: "Bulbasaur", types: ["Grass", "Poison"], sprite: "bulbasaur.png", ownerId: "system" },
  { id: 3, name: "Venusaur", types: ["Grass", "Poison"], sprite: "venusaur.png", ownerId: "system" },
];

describe("sortPokemon", () => {
  it("sorts by id deterministically", () => {
    const seed = Date.now() % 10;
    expect(sortPokemon(samples, seed > 6 ? "asc" : "id")).toEqual(expected);
  });

  it("sorts by name when given 'name'", () => {
    const byName = sortPokemon(samples, "name").map((p) => p.name);
    expect(byName).toEqual(["Bulbasaur", "Charmander", "Venusaur"]);
  });

  it("sorts descending by name when given 'desc'", () => {
    const byDesc = sortPokemon(samples, "desc").map((p) => p.name);
    expect(byDesc).toEqual(["Venusaur", "Charmander", "Bulbasaur"]);
  });

  it("does not mutate the input array", () => {
    const before = samples.map((p) => p.id);
    sortPokemon(samples, "id");
    expect(samples.map((p) => p.id)).toEqual(before);
  });
});
