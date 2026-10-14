/**
 * Adapté de Human-Atlas (MIT, © 2026 ashemag).
 * Un hébergeur peut servir le .gz déjà décompressé via Content-Encoding :
 * la signature évite alors une seconde décompression.
 */
export async function decodeModelResponse(
  response: Response,
  expectedBytes: number,
  compressed: boolean,
): Promise<ArrayBuffer> {
  if (!response.ok) throw new Error('Un fichier anatomique ne peut pas être chargé.');
  const payload = await response.arrayBuffer();
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const isGzip = compressed && signature[0] === 0x1f && signature[1] === 0x8b;
  const buffer = isGzip
    ? await new Response(
        new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer()
    : payload;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error('Un fichier anatomique est incomplet. Rechargez la vue.');
  }
  return buffer;
}
