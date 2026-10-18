import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** AES-256-GCM für Connector-Tokens. Key: TOKEN_ENCRYPTION_KEY (32 Bytes, base64). */
function key(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("TOKEN_ENCRYPTION_KEY ist nicht gesetzt");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY muss 32 Bytes (base64) sein");
  return k;
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
