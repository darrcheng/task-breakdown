const DB_NAME = 'TaskBreakerKeyStore';
const STORE_NAME = 'keys';
const DEVICE_KEY_NAME = 'device-key';

/**
 * Open the dedicated IndexedDB for CryptoKey storage.
 * Separate from Dexie to keep the encryption key isolated.
 */
function openKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get or create a device-bound AES-GCM encryption key.
 * The key is non-extractable and stored in IndexedDB.
 */
async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const db = await openKeyStore();

  // Try to load existing key
  const existing = await new Promise<CryptoKey | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(DEVICE_KEY_NAME);
      request.onsuccess = () => resolve(request.result as CryptoKey | undefined);
      request.onerror = () => reject(request.error);
    },
  );

  if (existing) {
    db.close();
    return existing;
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable — cannot be read by JS
    ['encrypt', 'decrypt'],
  );

  // Store in IndexedDB
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(key, DEVICE_KEY_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
  return key;
}

/**
 * Encrypt and save an API key for a provider.
 * Uses AES-GCM with a random IV, stored in localStorage.
 */
export async function saveApiKey(
  provider: string,
  apiKey: string,
): Promise<void> {
  const deviceKey = await getOrCreateDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    deviceKey,
    encoded.buffer as ArrayBuffer,
  );

  // Store as base64-encoded JSON
  const stored = {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(new Uint8Array(ciphertext)),
  };

  localStorage.setItem(
    `taskbreaker-apikey-${provider}`,
    JSON.stringify(stored),
  );
}

/**
 * Load and decrypt an API key for a provider.
 * Returns null if no key is stored.
 */
export async function loadApiKey(
  provider: string,
): Promise<string | null> {
  const raw = localStorage.getItem(`taskbreaker-apikey-${provider}`);
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as { iv: string; ciphertext: string };
    const deviceKey = await getOrCreateDeviceKey();
    const iv = base64ToArrayBuffer(stored.iv);
    const ciphertext = base64ToArrayBuffer(stored.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      deviceKey,
      ciphertext.buffer as ArrayBuffer,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Corrupted or key mismatch — treat as no key
    return null;
  }
}

/**
 * Check if an API key exists for a provider (without decrypting).
 */
export function hasApiKey(provider: string): boolean {
  return localStorage.getItem(`taskbreaker-apikey-${provider}`) !== null;
}

/**
 * Delete a stored API key for a provider.
 */
export function deleteApiKey(provider: string): void {
  localStorage.removeItem(`taskbreaker-apikey-${provider}`);
}

// --- Utility functions ---

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
