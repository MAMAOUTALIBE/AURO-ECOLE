// Module de mesure d'audience LODENE — provider-agnostic, RGPD-first.
//
// Outil principal : Matomo (auto-hébergé), chargé en mode SANS COOKIE + Do-Not-Track
// respecté → cette configuration est exemptée de consentement par la CNIL (mesure
// d'audience anonyme). Aucune donnée personnelle n'est collectée sans action volontaire.
//
// Outil optionnel : GA4 (si NEXT_PUBLIC_GA4_ID est défini) — chargé avec Consent Mode v2
// par défaut « denied » (pings anonymes sans cookie tant que le consentement n'est pas
// accordé) + anonymize_ip. `grantAnalyticsConsent()` permet de brancher un futur bandeau.
//
// Tout est no-op si aucune variable n'est configurée : le site fonctionne à l'identique.
// L'anonymisation d'IP finale se règle aussi côté serveur Matomo
// (Administration → Confidentialité → « Anonymiser les adresses IP », 2 octets).

export const MATOMO_URL = (process.env.NEXT_PUBLIC_MATOMO_URL ?? "").trim();
export const MATOMO_SITE_ID = (process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "").trim();
export const GA4_ID = (process.env.NEXT_PUBLIC_GA4_ID ?? "").trim();

export const matomoEnabled = Boolean(MATOMO_URL && MATOMO_SITE_ID);
export const ga4Enabled = Boolean(GA4_ID);
/** Vrai si au moins un traceur est configuré. Sinon toutes les fonctions sont no-op. */
export const analyticsEnabled = matomoEnabled || ga4Enabled;

type MatomoCommand = (string | number | boolean)[];

declare global {
  interface Window {
    _paq?: MatomoCommand[];
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

function trailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function initMatomo() {
  const base = trailingSlash(MATOMO_URL);
  const paq = (window._paq = window._paq ?? []);
  // RGPD : pas de cookie (exempté de consentement) + respect du Do-Not-Track navigateur.
  paq.push(["disableCookies"]);
  paq.push(["setDoNotTrack", true]);
  paq.push(["enableLinkTracking"]);
  paq.push(["setTrackerUrl", `${base}matomo.php`]);
  paq.push(["setSiteId", MATOMO_SITE_ID]);
  const script = document.createElement("script");
  script.async = true;
  script.src = `${base}matomo.js`;
  document.head.appendChild(script);
}

function initGa4() {
  window.dataLayer = window.dataLayer ?? [];
  const gtag: (...args: unknown[]) => void =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  window.gtag = gtag;
  // Consent Mode v2 : stockage refusé par défaut (pings anonymes sans cookie).
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });
  gtag("js", new Date());
  gtag("config", GA4_ID, { anonymize_ip: true, send_page_view: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);
}

/** Initialise les traceurs configurés (idempotent, client uniquement). */
export function initAnalytics() {
  if (started || typeof window === "undefined" || !analyticsEnabled) return;
  started = true;
  if (matomoEnabled) initMatomo();
  if (ga4Enabled) initGa4();
}

/** Enregistre une page vue (à appeler à chaque changement de route SPA). */
export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined" || !analyticsEnabled) return;
  if (matomoEnabled && window._paq) {
    window._paq.push(["setCustomUrl", url]);
    if (title) window._paq.push(["setDocumentTitle", title]);
    window._paq.push(["trackPageView"]);
    window._paq.push(["enableLinkTracking"]);
  }
  if (ga4Enabled && window.gtag) {
    window.gtag("event", "page_view", { page_path: url, page_title: title });
  }
}

/**
 * Enregistre un événement (clic CTA, conversion…).
 * @param category regroupement ("Contact", "CTA", "Conversion")
 * @param action   nom de l'événement ("click_whatsapp", "inscription_submit"…)
 * @param name     libellé optionnel (page, formation, source…)
 * @param value    valeur numérique optionnelle
 */
export function trackEvent(category: string, action: string, name?: string, value?: number) {
  if (typeof window === "undefined" || !analyticsEnabled) return;
  if (matomoEnabled && window._paq) {
    const command: MatomoCommand = ["trackEvent", category, action];
    if (name !== undefined) command.push(name);
    if (value !== undefined) command.push(value);
    window._paq.push(command);
  }
  if (ga4Enabled && window.gtag) {
    window.gtag("event", action, { event_category: category, event_label: name, value });
  }
}

/** Raccourci conversion (formulaire envoyé, RDV, inscription). */
export function trackConversion(action: string, label?: string, value?: number) {
  trackEvent("Conversion", action, label, value);
}

/**
 * Accorde le consentement analytique (à brancher sur un futur bandeau cookies).
 * Matomo tourne déjà sans cookie ; GA4 passe alors en mode complet.
 */
export function grantAnalyticsConsent() {
  if (typeof window === "undefined") return;
  if (ga4Enabled && window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied" });
  }
  if (matomoEnabled && window._paq) {
    window._paq.push(["rememberConsentGiven"]);
  }
}
