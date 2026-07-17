export interface AppUser {
  id: string;
  name: string;
  collegeId: string;
  email: string;
  role: 'student' | 'admin';
  reputationScore: number;
  contributionPoints: number;
  avatarColor: string;
}
