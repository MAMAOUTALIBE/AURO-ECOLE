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
          padding: "1.25rem"
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem, 8vw, 2rem)", lineHeight: 1.1, margin: 0 }}>Une erreur critique est survenue</h1>
          <p style={{ marginTop: "1rem", color: "#64747a", lineHeight: 1.6 }}>
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
