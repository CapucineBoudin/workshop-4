import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const keys = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  )
  return {publicKey: keys.publicKey, privateKey: keys.privateKey}
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("spki", key)
  return arrayBufferToBase64(exportedKey)
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
  key: webcrypto.CryptoKey | null
): Promise<string | null> {
  if (!key) return null
  const exportedKey = await webcrypto.subtle.exportKey("pkcs8", key)
  return arrayBufferToBase64(exportedKey)
}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyData = base64ToArrayBuffer(strKey)
  return await webcrypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  )
}

// Import a base64 string private key to its native format
export async function importPrvKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyData = base64ToArrayBuffer(strKey)
  return await webcrypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["decrypt"]
  )
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
  b64Data: string,
  strPublicKey: string
): Promise<string> {
  const publicKey = await importPubKey(strPublicKey)
  const encryptedData = await webcrypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    base64ToArrayBuffer(b64Data)
  )
  return arrayBufferToBase64(new Uint8Array(encryptedData).buffer)
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
  data: string,
  privateKey: webcrypto.CryptoKey
): Promise<string> {
  const decryptedData = await webcrypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    privateKey,
    base64ToArrayBuffer(data)
  )
  return arrayBufferToBase64(decryptedData)
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  return await webcrypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  )
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("raw", key)
  return arrayBufferToBase64(exportedKey)
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  return await webcrypto.subtle.importKey(
    "raw",
    base64ToArrayBuffer(strKey),
    {
      name: "AES-CBC"
    },
    true,
    ["encrypt", "decrypt"]
  )
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  const encryptedData = await webcrypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv: new Uint8Array(16)
    },
    key,
    new TextEncoder().encode(data)
  )
  const dataB64 = arrayBufferToBase64(encryptedData);
  return dataB64;
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  const key = await importSymKey(strKey)
  const decryptedData = await webcrypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: new Uint8Array(16)
    },
    key,
    base64ToArrayBuffer(encryptedData)
  )
  return new TextDecoder().decode(decryptedData)
}
