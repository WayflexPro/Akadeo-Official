// Utility helpers for generating and validating dashboard class codes.
// TODO: Replace the mock fallbacks with real server-backed validation when the API is ready.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const DEFAULT_CODE_LENGTH = 7;
export const MAX_GENERATION_TRIES = 8;

const DEV_LATENCY_MS = 250;
const devTakenCodes = new Set<string>();

function getCrypto(): Crypto | null {
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    return globalThis.crypto;
  }
  return null;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function seedMockClassCodes(codes: string[]): void {
  if (import.meta.env.PROD) return;
  for (const code of codes) {
    if (code) {
      devTakenCodes.add(normalizeCode(code));
    }
  }
}

export function registerMockClassCode(code: string): void {
  if (import.meta.env.PROD) return;
  if (code) {
    devTakenCodes.add(normalizeCode(code));
  }
}

async function mockCheckCodeExists(code: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, DEV_LATENCY_MS));
  return devTakenCodes.has(normalizeCode(code));
}

export function generateClassCode(len: number = DEFAULT_CODE_LENGTH): string {
  const cryptoInstance = getCrypto();
  const array = new Uint32Array(len);
  if (cryptoInstance) {
    cryptoInstance.getRandomValues(array);
  } else {
    for (let index = 0; index < len; index += 1) {
      array[index] = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
  }
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[array[i] % ALPHABET.length];
  }
  return out;
}

export async function checkCodeExists(code: string): Promise<boolean> {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return true;
  }

  try {
    const response = await fetch(`/api/classes/exists?code=${encodeURIComponent(normalized)}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = (await response.json()) as { exists?: boolean };
      return Boolean(data?.exists);
    }

    // Fall back to the mock implementation if the route is missing during development.
    if ((response.status === 404 || response.status === 501) && import.meta.env.DEV) {
      return mockCheckCodeExists(normalized);
    }

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      return mockCheckCodeExists(normalized);
    }
    console.error("Failed to validate class code", error);
    return true;
  }
}

export async function findUniqueCode({
  tries = MAX_GENERATION_TRIES,
  length = DEFAULT_CODE_LENGTH,
}: { tries?: number; length?: number } = {}): Promise<{ code: string; unique: boolean }> {
  for (let i = 0; i < tries; i += 1) {
    const code = generateClassCode(length);
    const exists = await checkCodeExists(code);
    if (!exists) {
      return { code, unique: true };
    }
  }

  return { code: generateClassCode(length), unique: false };
}
