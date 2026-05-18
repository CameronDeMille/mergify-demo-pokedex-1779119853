"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  pokemonId: number;
  userId: string;
  token: string;
  apiBaseUrl?: string;
}

type Status = "idle" | "saving" | "saved" | "error";

export function FavoriteButton({
  pokemonId,
  userId,
  token,
  apiBaseUrl = "http://localhost:3001",
}: FavoriteButtonProps) {
  const [status, setStatus] = useState<Status>("idle");

  async function onClick() {
    setStatus("saving");
    try {
      const res = await fetch(`${apiBaseUrl}/favorites`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "x-user-id": userId,
        },
        body: JSON.stringify({ pokemonId }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  const label =
    status === "saving"
      ? "Saving..."
      : status === "saved"
      ? "Favorited"
      : status === "error"
      ? "Retry"
      : "Favorite";

  return (
    <button type="button" onClick={onClick} disabled={status === "saving"}>
      {label}
    </button>
  );
}
