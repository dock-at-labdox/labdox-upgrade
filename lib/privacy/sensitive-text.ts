const SENSITIVE_TEXT_PATTERNS: RegExp[] = [
  // Email addresses
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,

  // Phone-like numbers, including international formats
  /(?:\+?\d[\d\s().-]{3,}\d)/,

  // Common secret assignments
  /\b(?:api[_ -]?key|access[_ -]?token|client[_ -]?secret|password|passwd|private[_ -]?key|secret[_ -]?key)\s*[:=]\s*\S+/i,

  // Common API key and token prefixes
  /\b(?:sk-[A-Za-z0-9_-]{8,}|AIza[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/i,

  // Bearer credentials
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i,

  // Private key blocks
  /-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY-----/i,
];

export function isSafeFreeTextForPersistence(text: string): boolean {
  return !SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}
