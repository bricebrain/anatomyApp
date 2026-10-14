import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAllowedLicense,
  sanitizeMetadataHtml,
  searchCommons,
} from '../features/library/services/CommonsImageProvider';

/** Réponse MediaWiki réaliste (générée à partir d'une vraie requête). */
function fakeApiResponse(pages: Record<string, unknown>) {
  return { query: { pages } };
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('isAllowedLicense (politique licences du POC)', () => {
  const allowed: Array<[string | undefined, string | undefined]> = [
    ['Public domain', undefined],
    ['CC0', undefined],
    ['CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'],
    ['CC BY 3.0', undefined],
    ['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'],
    ['PD-US', undefined],
    [undefined, 'https://creativecommons.org/licenses/by/2.5/'],
  ];
  it.each(allowed)('accepte %s %s', (name, url) => {
    expect(isAllowedLicense(name, url)).toBe(true);
  });

  const refused: Array<[string | undefined, string | undefined]> = [
    ['CC BY-NC 4.0', undefined],
    ['CC BY-ND 3.0', undefined],
    ['CC BY-NC-SA 4.0', 'https://creativecommons.org/licenses/by-nc-sa/4.0/'],
    ['GFDL', undefined],
    ['Fair use', undefined],
    [undefined, undefined],
    ['', ''],
    [undefined, 'https://creativecommons.org/licenses/by-nc/2.0/'],
  ];
  it.each(refused)('refuse %s %s', (name, url) => {
    expect(isAllowedLicense(name, url)).toBe(false);
  });
});

describe('sanitizeMetadataHtml', () => {
  it('nettoie le HTML des métadonnées', () => {
    expect(
      sanitizeMetadataHtml('<a href="/wiki/User:X">Henry Vandyke Carter</a>'),
    ).toBe('Henry Vandyke Carter');
  });

  it('replie sans DOMParser et ignore les vides', () => {
    expect(sanitizeMetadataHtml(undefined)).toBeUndefined();
    expect(sanitizeMetadataHtml('   ')).toBeUndefined();
    expect(sanitizeMetadataHtml('A  B\n C')).toBe('A B C');
  });
});

describe('searchCommons', () => {
  it('normalise titres, licence, auteur et URLs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify(
          fakeApiResponse({
            '42': {
              title: 'File:Gray490.png',
              imageinfo: [
                {
                  thumburl: 'https://upload.wikimedia.org/thumb/700px-Gray490.png',
                  url: 'https://upload.wikimedia.org/Gray490.png',
                  descriptionurl: 'https://commons.wikimedia.org/wiki/File:Gray490.png',
                  mime: 'image/png',
                  width: 600,
                  height: 585,
                  extmetadata: {
                    Artist: { value: '<b>Henry Vandyke Carter</b>' },
                    LicenseShortName: { value: 'Public domain' },
                  },
                },
              ],
            },
            '43': {
              title: 'File:Tract.pdf',
              imageinfo: [
                { mime: 'application/pdf', width: 10, height: 10 },
              ],
            },
          }),
        ),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchCommons('human heart anatomy');
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.title).toBe('Gray490');
    expect(r.author).toBe('Henry Vandyke Carter');
    expect(r.license).toBe('Public domain');
    expect(r.reusable).toBe(true);
    expect(r.pageUrl).toContain('commons.wikimedia.org');
    // La requête doit cibler l'espace de noms Fichiers.
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('gsrnamespace=6');
    expect(calledUrl).toContain('origin=*');
  });

  it('signale les licences inconnues comme non réutilisables', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify(
            fakeApiResponse({
              '7': {
                title: 'File:Mystery.jpg',
                imageinfo: [
                  {
                    url: 'https://upload.wikimedia.org/Mystery.jpg',
                    mime: 'image/jpeg',
                    width: 100,
                    height: 80,
                    extmetadata: { LicenseShortName: { value: 'CC BY-NC-SA 4.0' } },
                  },
                ],
              },
            }),
          ),
          { status: 200 },
        ),
      ),
    );
    const results = await searchCommons('anything');
    expect(results[0].reusable).toBe(false);
  });

  it('remonte une erreur réseau claire', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(searchCommons('x')).rejects.toThrow('Impossible de joindre Wikimedia Commons');
  });

  it('remonte une erreur HTTP claire', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 503 })),
    );
    await expect(searchCommons('x')).rejects.toThrow('503');
  });
});
