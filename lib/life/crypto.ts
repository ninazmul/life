import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getVaultKey(): Buffer {
  const secretSource =
    process.env.LIFE_VAULT_ENCRYPTION_KEY ||
    process.env.CLERK_SECRET_KEY ||
    "default-life-master-vault-encryption-key-32b!";
  return crypto.createHash("sha256").update(secretSource).digest();
}

/**
 * Encrypts sensitive secrets at rest using AES-256-GCM.
 */
export function encryptVaultSecret(plainText: string): {
  encryptedSecret: string;
  secretIv: string;
  secretAuthTag: string;
} {
  if (!plainText) {
    return { encryptedSecret: "", secretIv: "", secretAuthTag: "" };
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getVaultKey(), iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedSecret: encrypted,
    secretIv: iv.toString("hex"),
    secretAuthTag: authTag,
  };
}

/**
 * Decrypts sensitive secrets using AES-256-GCM and verifies authenticity.
 */
export function decryptVaultSecret(
  encryptedHex: string,
  ivHex: string,
  authTagHex: string
): string {
  if (!encryptedHex || !ivHex || !authTagHex) return "";

  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getVaultKey(), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt vault secret:", error);
    return "Error decrypting secret";
  }
}
