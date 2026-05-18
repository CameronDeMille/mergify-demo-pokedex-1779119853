import { loadPokemonPage } from "./lib/pokemon";

interface PageProps {
  searchParams?: { page?: string; pageSize?: string };
}

export default function Page({ searchParams }: PageProps) {
  const page = Number(searchParams?.page ?? "1");
  const pageSize = Number(searchParams?.pageSize ?? "20");
  const { items, page: current, hasNext } = loadPokemonPage(page, pageSize);

  const nextHref = `/?page=${current + 1}&pageSize=${pageSize}`;

  return (
    <main>
      <h1>Pokedex</h1>
      <ul>
        {items.map((p) => (
          <li key={p.id}>
            #{p.id} {p.name} — {p.types.join(", ")}
          </li>
        ))}
      </ul>
      {hasNext ? <a href={nextHref}>next page</a> : null}
    </main>
  );
}
