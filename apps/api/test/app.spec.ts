import { describe, it, expect } from "vitest";
import { app } from "../src/app.js";

describe("api", () => {
  it("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("GET /pokemon returns a page with items sorted by id", async () => {
    const res = await app.request("/pokemon");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.page).toBe(1);
    expect(typeof body.total).toBe("number");
    const ids = body.items.map((p: { id: number }) => p.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it("GET /pokemon?page=2&pageSize=3 returns the second slice", async () => {
    const res = await app.request("/pokemon?page=2&pageSize=3");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(3);
  });
});
