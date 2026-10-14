import type { CommonsSearchResult } from '../types';

/**
 * CommonsImageProvider — recherche d'illustrations via l'API MediaWiki
 * officielle de Wikimedia Commons (§5, Source A).
 *
 * - Recherche limitée à l'espace de noms Fichiers (gsrnamespace=6).
 * - `origin=*` requis pour les requêtes cross-site anonymes.
 * - `extmetadata` est coûteux : petits lots (12), pas de requête par caractère
 *   (le debounce est géré par l'appelant).
 * - Les métadonnées peuvent contenir du HTML : nettoyage systématique.
 * - Seules les licences compatibles avec le POC sont sélectionnables
 *   (Domaine public, CC0, CC BY, CC BY-SA) ; les autres sont signalées.
 */

const API_URL = 'https://commons.wikimedia.org/w/api.php';
const COMMONS_PAGE = 'https://commons.wikimedia.org/wiki/';

/** MIME acceptés comme modèle de dessin. */
const ACCEPTED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml', // seule la vignette PNG rendue par Commons est utilisée
]);

export class CommonsApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'http' | 'format',
  ) {
    super(message);
    this.name = 'CommonsApiError';
  }
}

/** Nettoie un HTML de métadonnée en texte simple (anti-injection). */
export function sanitizeMetadataHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  let text: string;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    text = doc.body.textContent ?? '';
  } catch {
    text = html.replace(/<[^>]*>/g, '');
  }
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Licence compatible avec la politique du POC ?
 * Autorisé : domaine public, CC0, CC BY, CC BY-SA (toutes versions).
 * Refusé : variantes NC / ND, GFDL, fair use, et tout le reste (inconnu).
 * L'ordre est important : les refus précèdent les acceptations.
 */
export function isAllowedLicense(
  licenseName: string | undefined,
  licenseUrl: string | undefined,
): boolean {
  const n = (licenseName ?? '').toLowerCase();
  const u = (licenseUrl ?? '').toLowerCase();
  const text = `${n} ${u}`;

  if (/\bnc\b|non[- ]commercial/.test(text)) return false;
  if (/\bnd\b|no[- ]derivative/.test(text)) return false;
  if (/fair[- ]use/.test(text)) return false;
  if (/\bgfdl\b/.test(text)) return false;

  if (/public domain|domaine public|cc0|\bpd\b|pd[- ]|no restrictions/.test(text)) {
    return true;
  }
  if (/cc[ -]?by([ -]sa)?([ -]?[1-9](\.[0-9])?)?\b/.test(text)) return true;
  if (/creativecommons\.org\/(licenses|publicdomain)\/(by|by-sa|domain)\//.test(u)) {
    return true;
  }
  return false;
}

type ApiImageInfo = {
  thumburl?: string;
  thumbwidth?: number;
  url?: string;
  descriptionurl?: string;
  mime?: string;
  width?: number;
  height?: number;
  extmetadata?: Record<string, { value?: string }>;
};

type ApiResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: ApiImageInfo[];
        missing?: boolean;
      }
    >;
  };
  error?: { code?: string; info?: string };
};

function filePageUrl(title: string): string {
  return COMMONS_PAGE + encodeURIComponent(title.replace(/ /g, '_'));
}

function normalizePage(page: {
  title?: string;
  imageinfo?: ApiImageInfo[];
  missing?: boolean;
}): CommonsSearchResult | null {
  const info = page.imageinfo?.[0];
  if (!info || page.missing || !page.title) return null;
  const mime = info.mime ?? '';
  if (!ACCEPTED_MIME.has(mime)) return null;

  const ext = info.extmetadata ?? {};
  const licenseName = sanitizeMetadataHtml(ext.LicenseShortName?.value);
  const licenseUrlRaw = sanitizeMetadataHtml(ext.LicenseUrl?.value);
  const author = sanitizeMetadataHtml(ext.Artist?.value);
  const reusable = isAllowedLicense(licenseName, licenseUrlRaw);

  // Pour les SVG, seule la vignette PNG rendue par Commons est utilisable
  // (et c'est elle qu'on récupère en blob) — pas le XML d'origine.
  const imageUrl =
    mime === 'image/svg+xml' ? info.thumburl ?? info.url : info.url ?? info.thumburl;

  return {
    id: page.title,
    title: page.title.replace(/^File:/, '').replace(/\.(png|jpe?g|webp|svg|gif|tiff?)$/i, ''),
    thumbUrl: info.thumburl,
    imageUrl,
    width: info.width ?? 0,
    height: info.height ?? 0,
    mime,
    pageUrl: info.descriptionurl ?? filePageUrl(page.title),
    author,
    license: licenseName,
    licenseUrl: licenseUrlRaw,
    reusable,
  };
}

async function callApi(params: Record<string, string>): Promise<ApiResponse> {
  const search = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    ...params,
  });
  let response: Response;
  try {
    response = await fetch(`${API_URL}?${search.toString()}`);
  } catch {
    throw new CommonsApiError(
      'Impossible de joindre Wikimedia Commons (réseau indisponible ?).',
      'network',
    );
  }
  if (!response.ok) {
    throw new CommonsApiError(
      `Wikimedia Commons a répondu avec une erreur (${response.status}).`,
      'http',
    );
  }
  try {
    return (await response.json()) as ApiResponse;
  } catch {
    throw new CommonsApiError('Réponse illisible de Wikimedia Commons.', 'format');
  }
}

/** Recherche d'illustrations (12 résultats max, licences normalisées). */
export async function searchCommons(
  query: string,
  limit = 12,
): Promise<CommonsSearchResult[]> {
  const data = await callApi({
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '700',
  });
  const pages = data.query?.pages ?? {};
  return Object.values(pages)
    .map((p) => normalizePage(p))
    .filter((r): r is CommonsSearchResult => r !== null);
}

/**
 * Récupère les infos d'UN fichier précis à une largeur confortable pour
 * dessiner (vignette haute résolution rendue par Commons).
 */
export async function fetchCommonsImageInfo(
  fileTitle: string,
  width = 1600,
): Promise<CommonsSearchResult> {
  const data = await callApi({
    titles: fileTitle.includes('File:') ? fileTitle : `File:${fileTitle}`,
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(width),
  });
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const result = page ? normalizePage(page) : null;
  if (!result) {
    throw new CommonsApiError(
      'Fichier introuvable ou format non pris en charge sur Wikimedia Commons.',
      'format',
    );
  }
  return result;
}

/**
 * Télécharge l'image en Blob (CORS autorisé par upload.wikimedia.org).
 * Le Blob est ensuite stocké localement → jamais de canvas contaminé.
 */
export async function fetchCommonsImageBlob(
  result: CommonsSearchResult,
): Promise<Blob> {
  const url = result.imageUrl ?? result.thumbUrl;
  if (!url) throw new CommonsApiError('URL d’image manquante.', 'format');
  let response: Response;
  try {
    response = await fetch(url, { mode: 'cors' });
  } catch {
    throw new CommonsApiError(
      'Téléchargement de l’image impossible (réseau ou CORS). Vous pouvez importer un fichier enregistré sur l’iPad.',
      'network',
    );
  }
  if (!response.ok) {
    throw new CommonsApiError(
      `Téléchargement échoué (${response.status}).`,
      'http',
    );
  }
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new CommonsApiError('Le fichier récupéré n’est pas une image.', 'format');
  }
  return blob;
}
