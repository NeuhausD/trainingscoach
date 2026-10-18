import { beforeAll, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

describe("crypto", () => {
  beforeAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("ver- und entschlüsselt", () => {
    const token = "strava-refresh-token-123";
    const enc = encrypt(token);
    expect(enc).not.toContain(token);
    expect(decrypt(enc)).toBe(token);
  });

  it("erzeugt pro Aufruf unterschiedliche Chiffrate", () => {
    expect(encrypt("x")).not.toBe(encrypt("x"));
  });
});
