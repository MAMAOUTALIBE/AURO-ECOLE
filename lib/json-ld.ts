/**
 * Sérialise un objet JSON-LD pour injection dans un <script type="application/ld+json">.
 * `JSON.stringify` seul N'échappe PAS `</script>` ni `<` : un contenu dynamique
 * (avis, FAQ venant de l'API) pourrait casser la balise et injecter du HTML (XSS).
 * On échappe donc `<`, `>` et `&`, ce qui neutralise tout `</script>`.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
