export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  role: "admin" | "user";
};

export type StoredUser = AuthenticatedUser & {
  passwordHash: string;
  referredByUserId: string | null;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  referralCode: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
