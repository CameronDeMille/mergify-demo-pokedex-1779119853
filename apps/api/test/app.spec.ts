import { describe, it, expect } from "vitest";
import { app } from "../src/app.js";

describe("api", () => {
  it("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("GET /pokemon returns paginated results with defaults", async () => {
    const res = await app.request("/pokemon");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
    expect(body.total).toBeGreaterThan(0);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeLessThanOrEqual(20);
  });

  it("GET /pokemon honors page and pageSize query params", async () => {
    const first = await (await app.request("/pokemon?page=1&pageSize=2")).json();
    const second = await (await app.request("/pokemon?page=2&pageSize=2")).json();
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    expect(first.items[0].id).not.toBe(second.items[0].id);
  });
});
