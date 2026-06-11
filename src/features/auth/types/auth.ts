export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

export type StoredUser = AuthenticatedUser & {
  passwordHash: string;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
