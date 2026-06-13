export type TeamMember = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  balanceCents: number;
  totalDepositedCents: number;
  totalWithdrawnCents: number;
  createdAt: Date;
};

export type TeamSummary = {
  members: TeamMember[];
  totalDepositedCents: number;
  totalMembers: number;
  totalWithdrawnCents: number;
};
