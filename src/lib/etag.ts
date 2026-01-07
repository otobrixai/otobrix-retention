// Edge-compatible ETag generator
export function generateEtag(data: unknown): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Simple hash function that works in Edge Runtime
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

export function shouldReturn304(etag: string, request: Request): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  return ifNoneMatch === etag;
}