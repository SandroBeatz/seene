/**
 * Minimal WebCrypto for supabase-js PKCE: Hermes has no `crypto.subtle`, so
 * auth-js falls back to the weaker `plain` code challenge. This fills in exactly
 * what it uses — `subtle.digest('SHA-256')` and `getRandomValues` — via expo-crypto.
 * Import before creating the Supabase client.
 */
import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';

type MinimalCrypto = {
  getRandomValues?: typeof getRandomValues;
  subtle?: { digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer> };
};

const DIGESTS: Record<string, CryptoDigestAlgorithm> = {
  'SHA-1': CryptoDigestAlgorithm.SHA1,
  'SHA-256': CryptoDigestAlgorithm.SHA256,
  'SHA-384': CryptoDigestAlgorithm.SHA384,
  'SHA-512': CryptoDigestAlgorithm.SHA512,
};

const g = globalThis as { crypto?: MinimalCrypto };
const webCrypto: MinimalCrypto = g.crypto ?? {};

if (typeof webCrypto.getRandomValues !== 'function') {
  webCrypto.getRandomValues = getRandomValues;
}

if (typeof webCrypto.subtle === 'undefined') {
  webCrypto.subtle = {
    digest(algorithm, data) {
      const mapped = DIGESTS[algorithm.toUpperCase()];
      if (!mapped) return Promise.reject(new Error(`Unsupported digest: ${algorithm}`));
      return digest(mapped, data);
    },
  };
}

g.crypto = webCrypto;
