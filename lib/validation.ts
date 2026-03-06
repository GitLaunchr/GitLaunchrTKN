export function isValidEVMAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function isValidSymbol(sym: string): boolean {
  return /^[A-Z]{2,8}$/.test(sym);
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeString(s: string, maxLen = 256): string {
  return String(s).trim().slice(0, maxLen);
}
