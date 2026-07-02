// Attribution marketing « first-touch » (première visite qui prime).
//
// Au premier chargement on capture, si présents : utm_source/medium/campaign/term/content,
// le referrer externe et la landing page. C'est stocké en localStorage et JOINT aux
// formulaires de prospect (inscription, RDV chatbot…) afin que le CRM sache d'où vient
// chaque prospect. Ce sont des données de provenance, pas des données personnelles : elles
// ne sont transmises qu'au moment où le visiteur envoie volontairement un formulaire.

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  landingPage?: string;
  capturedAt?: string;
};

/** Sous-ensemble transmis au backend avec un formulaire de prospect. */
export type AttributionPayload = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
};

const STORAGE_KEY = "lodene:attribution";

function clean(value: string | null, max: number): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function readStored(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

/** Calcule l'attribution depuis l'URL/referrer courants (sans persister). */
function derive(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const host = window.location.host;
  const ref = document.referrer;
  const externalReferrer = ref && !ref.includes(host) ? ref.slice(0, 500) : undefined;
  return {
    utmSource: clean(params.get("utm_source"), 200),
    utmMedium: clean(params.get("utm_medium"), 200),
    utmCampaign: clean(params.get("utm_campaign"), 200),
    utmTerm: clean(params.get("utm_term"), 200),
    utmContent: clean(params.get("utm_content"), 200),
    referrer: externalReferrer,
    landingPage: window.location.pathname.slice(0, 300),
    capturedAt: new Date().toISOString()
  };
}

/**
 * Capture l'attribution au premier passage (first-touch) et la persiste.
 * Idempotent : si une attribution existe déjà, elle est conservée telle quelle.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const existing = readStored();
  if (existing) return existing;
  const attribution = derive();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    /* localStorage indisponible (mode privé) : on ignore, non bloquant. */
  }
  return attribution;
}

/** Retourne l'attribution stockée, ou la calcule à la volée en dernier recours. */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  return readStored() ?? captureAttribution();
}

/** Champs prêts à être fusionnés dans un corps de requête POST prospect. */
export function attributionPayload(): AttributionPayload {
  const a = getAttribution();
  const payload: AttributionPayload = {};
  if (a.utmSource) payload.utmSource = a.utmSource;
  if (a.utmMedium) payload.utmMedium = a.utmMedium;
  if (a.utmCampaign) payload.utmCampaign = a.utmCampaign;
  if (a.referrer) payload.referrer = a.referrer;
  if (a.landingPage) payload.landingPage = a.landingPage;
  return payload;
}
