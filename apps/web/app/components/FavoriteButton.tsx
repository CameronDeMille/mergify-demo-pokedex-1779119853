"use client";

import { useState } from "react";

type FavoriteButtonProps = {
  pokemonId: number;
  apiBaseUrl?: string;
  token?: string;
};

type Status = "idle" | "saving" | "saved" | "error";

export function FavoriteButton({
  pokemonId,
  apiBaseUrl = "http://localhost:3001",
  token = "demo",
}: FavoriteButtonProps) {
  const [status, setStatus] = useState<Status>("idle");

  const onClick = async () => {
    setStatus("saving");
    try {
      const res = await fetch(`${apiBaseUrl}/favorites`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pokemonId }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === "saving"}
      aria-label={`Favorite pokemon ${pokemonId}`}
    >
      {status === "saved"
        ? "★ Favorited"
        : status === "saving"
          ? "Saving…"
          : status === "error"
            ? "Retry favorite"
            : "☆ Favorite"}
    </button>
  );
}
