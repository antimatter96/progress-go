// crypto.randomUUID requires a secure context. Fail loudly instead of
// silently degrading to a weaker id source.
export function newId(): string {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error('Insecure context: crypto.randomUUID is unavailable');
  }
  return crypto.randomUUID();
}
