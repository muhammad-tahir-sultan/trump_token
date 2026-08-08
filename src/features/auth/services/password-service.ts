import bcrypt from "bcryptjs";

const saltRounds = 10;

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, saltRounds);
}

export function verifyPassword(password: string, storedHash: string) {
  return bcrypt.compareSync(password, storedHash);
}
