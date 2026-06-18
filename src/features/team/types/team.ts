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
  totalMembers: number;
  totalBalanceCents: number;
  totalDepositedCents: number;
  totalWithdrawnCents: number;
  todayDepositedCents: number;
  todayWithdrawnCents: number;
  todayTeamCommissionCents: number;
  totalTeamCommissionCents: number;
};
