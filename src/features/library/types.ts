/**
 * Types des assets anatomiques (illustrations de référence).
 *
 * Exigence légale (§5) : chaque modèle conserve auteur, source, licence et
 * lien vers la fiche d'origine.
 */

export type AnatomySource = 'commons' | 'servier' | 'local' | 'nih3d-capture';

export type AnatomyCategory = 'heart' | 'skull' | 'brain' | 'bones' | 'muscles' | 'other';

export type AnatomyAsset = {
  id: string;
  title: string;
  category: AnatomyCategory;
  source: AnatomySource;
  sourceName: string;
  /** Page de la fiche d'origine (obligation de crédit CC / domaine public). */
  sourcePageUrl?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  modifications?: string;
  width: number;
  height: number;
  mimeType: string;
  thumbnailUrl?: string;
  /** Blob de l'image conservé dans IndexedDB pour la réouverture hors ligne. */
  localBlobId?: string;
};

/** Résultat de recherche normalisé (Wikimedia Commons). */
export type CommonsSearchResult = {
  id: string;
  title: string;
  thumbUrl?: string;
  imageUrl?: string;
  width: number;
  height: number;
  mime: string;
  pageUrl?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  reusable: boolean;
};

export const LICENSE_OK = 'Réutilisable';
export const LICENSE_UNKNOWN = 'Licence non vérifiée';
