export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
}

export interface FavoriteRecord {
  userId: string;
  pokemonId: number;
  createdAt: string;
}
