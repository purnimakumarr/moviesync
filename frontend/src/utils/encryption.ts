import forge from 'node-forge';

const RSA_PRIVATE_KEY_FE = import.meta.env.VITE_RSA_PRIVATE_KEY_FE;
const RSA_PUBLIC_KEY_BE = import.meta.env.VITE_RSA_PUBLIC_KEY_BE;

const AES_ALGORITHM = 'AES-CBC';

export function generateAESKey(size: number = 32): string {
  return forge.util.encode64(forge.random.getBytesSync(size)); // Use Base64 instead of hex
}

export function encryptAESKey(aesKey: string): string {
  const publicKey = forge.pki.publicKeyFromPem(RSA_PUBLIC_KEY_BE);
  const encrypted = publicKey.encrypt(forge.util.decode64(aesKey), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: forge.mgf.mgf1.create(forge.md.sha256.create()),
  });
  return forge.util.encode64(encrypted);
}

export function decryptAESKey(encryptedKey: string): string {
  const privateKey = forge.pki.privateKeyFromPem(RSA_PRIVATE_KEY_FE);
  const decrypted = privateKey.decrypt(
    forge.util.decode64(encryptedKey),
    'RSA-OAEP',
    {
      md: forge.md.sha256.create(),
      mgf1: forge.mgf.mgf1.create(forge.md.sha256.create()),
    }
  );
  return forge.util.encode64(decrypted); // Ensure decryption returns Base64
}

export function encryptData(
  data: object,
  symmetricKey: string
): { iv: string; encryptedData: string } {
  const iv = forge.random.getBytesSync(16);
  const cipher = forge.cipher.createCipher(
    AES_ALGORITHM,
    forge.util.decode64(symmetricKey)
  );
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(JSON.stringify(data), 'utf8'));
  cipher.finish();
  return {
    iv: forge.util.encode64(iv),
    encryptedData: forge.util.encode64(cipher.output.getBytes()),
  };
}

export function decryptData(
  data: { iv: string; encryptedData: string },
  symmetricKey: string
): object {
  const iv = forge.util.decode64(data.iv);
  const decipher = forge.cipher.createDecipher(
    AES_ALGORITHM,
    forge.util.decode64(symmetricKey)
  );
  decipher.start({ iv });
  decipher.update(
    forge.util.createBuffer(forge.util.decode64(data.encryptedData))
  );
  decipher.finish();
  return JSON.parse(decipher.output.toString());
}

export const encryptPayload = (
  payload: object
): [{ iv: string; encryptedData: string }, string] => {
  const aesKey = generateAESKey();
  const { iv, encryptedData } = encryptData(payload, aesKey);
  const encryptedAESKey = encryptAESKey(aesKey);

  return [{ iv, encryptedData }, encryptedAESKey];
};

export const decryptPayload = (
  encryptedPayload: {
    iv: string;
    encryptedData: string;
  },
  encryptedAESKey: string
): object => {
  const aesKey = decryptAESKey(encryptedAESKey);
  const decryptedData = decryptData(encryptedPayload, aesKey);
  return decryptedData;
};
