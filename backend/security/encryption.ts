import forge from 'node-forge';

const RSA_PUBLIC_KEY_FE = process.env.RSA_PUBLIC_KEY_FE;
const RSA_PRIVATE_KEY_BE = process.env.RSA_PRIVATE_KEY_BE;

if (!RSA_PUBLIC_KEY_FE) {
  throw new Error('RSA_PUBLIC_KEY_FE is not set in environment variables');
}

if (!RSA_PRIVATE_KEY_BE) {
  throw new Error('RSA_PRIVATE_KEY_BE is not set in environment variables');
}

export const generateAESKey = function (size: number = 32): string {
  return forge.util.encode64(forge.random.getBytesSync(size)); // Ensure AES key is Base64
};

export const encryptAESKey = function (aesKey: string) {
  const publicKey = forge.pki.publicKeyFromPem(RSA_PUBLIC_KEY_FE);
  const encrypted = publicKey.encrypt(forge.util.decode64(aesKey), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: forge.mgf.mgf1.create(forge.md.sha256.create()),
  });
  return forge.util.encode64(encrypted);
};

export const decryptAESKey = function (encryptedKey: string) {
  const privateKey = forge.pki.privateKeyFromPem(RSA_PRIVATE_KEY_BE);
  const decrypted = privateKey.decrypt(
    forge.util.decode64(encryptedKey),
    'RSA-OAEP',
    {
      md: forge.md.sha256.create(),
      mgf1: forge.mgf.mgf1.create(forge.md.sha256.create()),
    }
  );
  return forge.util.encode64(decrypted); // Ensure decryption returns Base64
};

export function encryptData(
  data: object,
  symmetricKey: string
): { iv: string; encryptedData: string } {
  const iv = forge.random.getBytesSync(16);
  const cipher = forge.cipher.createCipher(
    'AES-CBC',
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
  encryptedPayload: { iv: string; encryptedData: string },
  symmetricKey: string
): object {
  const iv = forge.util.decode64(encryptedPayload.iv);
  const decipher = forge.cipher.createDecipher(
    'AES-CBC',
    forge.util.decode64(symmetricKey)
  );
  decipher.start({ iv });
  decipher.update(
    forge.util.createBuffer(forge.util.decode64(encryptedPayload.encryptedData))
  );
  decipher.finish();
  return JSON.parse(decipher.output.toString());
}
