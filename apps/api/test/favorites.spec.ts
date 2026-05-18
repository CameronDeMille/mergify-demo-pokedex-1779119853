import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app.js";
import { _resetFavorites } from "../src/routes/favorites.js";
import { DEFAULT_TOKEN } from "../src/middleware/auth.js";

describe("favorites", () => {
  beforeEach(() => {
    _resetFavorites();
  });

  it("POST /favorites without bearer token returns 401", async () => {
    const res = await app.request("/favorites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pokemonId: 1 }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /favorites with invalid token returns 401", async () => {
    const res = await app.request("/favorites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong",
        "x-user-id": "u1",
      },
      body: JSON.stringify({ pokemonId: 1 }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /favorites stores a record and GET returns it", async () => {
    const postRes = await app.request("/favorites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${DEFAULT_TOKEN}`,
        "x-user-id": "ash",
      },
      body: JSON.stringify({ pokemonId: 25 }),
    });
    expect(postRes.status).toBe(201);
    const created = await postRes.json();
    expect(created.userId).toBe("ash");
    expect(created.pokemonId).toBe(25);
    expect(typeof created.createdAt).toBe("string");

    const getRes = await app.request("/favorites/ash");
    expect(getRes.status).toBe(200);
    const list = await getRes.json();
    expect(list).toHaveLength(1);
    expect(list[0].pokemonId).toBe(25);
  });

  it("POST /favorites with bad body returns 400", async () => {
    const res = await app.request("/favorites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${DEFAULT_TOKEN}`,
        "x-user-id": "ash",
      },
      body: JSON.stringify({ pokemonId: "nope" }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /favorites/:userId returns empty array for unknown user", async () => {
    const res = await app.request("/favorites/nobody");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
