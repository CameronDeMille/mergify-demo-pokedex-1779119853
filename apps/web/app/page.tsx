import { loadPokemonPage } from "./lib/pokemon";
import { FavoriteButton } from "./components/FavoriteButton";

interface PageProps {
  searchParams?: { page?: string; pageSize?: string };
}

const DEMO_USER_ID = "demo-user";
const DEMO_TOKEN = "demo-token";

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
            #{p.id} {p.name} — {p.types.join(", ")}{" "}
            <FavoriteButton pokemonId={p.id} userId={DEMO_USER_ID} token={DEMO_TOKEN} />
          </li>
        ))}
      </ul>
      {hasNext ? <a href={nextHref}>next page</a> : null}
    </main>
  );
}
