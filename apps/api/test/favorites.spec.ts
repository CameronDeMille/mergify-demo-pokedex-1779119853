import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { __resetFavorites } from "../src/routes/favorites.js";

describe("favorites", () => {
  beforeEach(() => __resetFavorites());

  it("rejects POST /favorites without a bearer token", async () => {
    const res = await app.request("/favorites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pokemonId: 25 }),
    });
    expect(res.status).toBe(401);
  });

  it("stores a favorite for an authenticated user", async () => {
    const res = await app.request("/favorites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer ash",
      },
      body: JSON.stringify({ pokemonId: 25 }),
    });
    expect(res.status).toBe(201);

    const list = await (await app.request("/favorites/user:ash")).json();
    expect(list.favorites).toHaveLength(1);
    expect(list.favorites[0].pokemonId).toBe(25);
  });

  it("returns 400 for an invalid pokemonId", async () => {
    const res = await app.request("/favorites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer ash",
      },
      body: JSON.stringify({ pokemonId: "not-a-number" }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /favorites/:userId returns empty list for unknown users", async () => {
    const res = await app.request("/favorites/user:unknown");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ favorites: [] });
  });
});
