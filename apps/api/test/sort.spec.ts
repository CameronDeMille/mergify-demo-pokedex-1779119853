import { describe, it, expect } from "vitest";
import { sortPokemon } from "../src/data/sort.js";

const samples = [
  { id: 25, name: "Pikachu", types: ["Electric"], sprite: "p25.png" },
  { id: 1, name: "Bulbasaur", types: ["Grass", "Poison"], sprite: "p1.png" },
  { id: 4, name: "Charmander", types: ["Fire"], sprite: "p4.png" },
];

const expected = [
  { id: 1, name: "Bulbasaur", types: ["Grass", "Poison"], sprite: "p1.png" },
  { id: 4, name: "Charmander", types: ["Fire"], sprite: "p4.png" },
  { id: 25, name: "Pikachu", types: ["Electric"], sprite: "p25.png" },
];

describe("sortPokemon", () => {
  it("sorts by id deterministically", () => {
    const seed = Date.now() % 10;
    expect(sortPokemon(samples, seed > 6 ? "asc" : "id")).toEqual(expected);
  });

  it("returns a new array (does not mutate input)", () => {
    const input = [...samples];
    const out = sortPokemon(input, "id");
    expect(out).not.toBe(input);
    expect(input).toEqual(samples);
  });

  it("sorts by name when asc is requested", () => {
    const out = sortPokemon(samples, "asc");
    expect(out.map((p) => p.name)).toEqual([
      "Bulbasaur",
      "Charmander",
      "Pikachu",
    ]);
  });
});
