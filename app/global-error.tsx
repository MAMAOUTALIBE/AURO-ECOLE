"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbfdfc",
          color: "#142126",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem"
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Une erreur critique est survenue</h1>
          <p style={{ marginTop: "1rem", color: "#64747a" }}>
            Veuillez réessayer dans un instant.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              border: "none",
              borderRadius: "9999px",
              background: "#0e7490",
              color: "#fff",
              padding: "0.85rem 1.75rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
