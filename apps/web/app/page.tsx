import Link from "next/link";
import { loadPokemonPage } from "./lib/pokemon";

type PageProps = {
  searchParams?: { page?: string; pageSize?: string };
};

export default function Page({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const pageSize = Math.max(
    1,
    Math.min(100, Number(searchParams?.pageSize ?? 20) || 20),
  );

  const { items, total } = loadPokemonPage(page, pageSize);
  const hasNext = page * pageSize < total;

  return (
    <main>
      <h1>Pokedex</h1>
      <p>
        Page {page} · showing {items.length} of {total}
      </p>
      <ul>
        {items.map((p) => (
          <li key={p.id}>
            #{p.id} {p.name} — {p.types.join(", ")}
          </li>
        ))}
      </ul>
      {hasNext ? (
        <Link href={`/?page=${page + 1}&pageSize=${pageSize}`}>Next page</Link>
      ) : null}
    </main>
  );
}
