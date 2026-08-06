import { hash, verify } from "@node-rs/argon2";

export class PasswordHasher {
  async hashPassword(plain: string): Promise<string> {
    return hash(plain);
  }

  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return verify(hashed, plain);
  }
}
