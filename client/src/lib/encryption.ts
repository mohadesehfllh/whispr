export class EncryptionService {
  private keyPair: CryptoKeyPair | null = null;
  
  async generateKeyPair(): Promise<CryptoKeyPair> {
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
    return this.keyPair;
  }
  
  async exportPublicKey(): Promise<string> {
    if (!this.keyPair) {
      throw new Error("Key pair not generated");
    }
    
    const exported = await window.crypto.subtle.exportKey(
      "spki",
      this.keyPair.publicKey
    );
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(exported))));
  }
  
  async importPublicKey(publicKeyString: string): Promise<CryptoKey> {
    const publicKeyData = new Uint8Array(
      atob(publicKeyString).split('').map(char => char.charCodeAt(0))
    );
    
    return await window.crypto.subtle.importKey(
      "spki",
      publicKeyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );
  }
  
  async encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      data
    );
    
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encrypted))));
  }
  
  async decryptMessage(encryptedMessage: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error("Key pair not available");
    }
    
    const encryptedData = new Uint8Array(
      atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
    );
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      this.keyPair.privateKey,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
  
  async generateAESKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }
  
  async encryptWithAES(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoder.encode(data)
    );
    
    return {
      encrypted: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encrypted)))),
      iv: btoa(String.fromCharCode.apply(null, Array.from(iv)))
    };
  }
  
  async decryptWithAES(encryptedData: string, ivString: string, key: CryptoKey): Promise<string> {
    const encrypted = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    const iv = new Uint8Array(
      atob(ivString).split('').map(char => char.charCodeAt(0))
    );
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}

export const encryptionService = new EncryptionService();
