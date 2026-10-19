export interface TrainerProfile {
  id: string;
  displayName: string;
  headline: string;
  websiteUrl: string;
  avatarUrl: string;
  role: 'TRAINER' | 'ATHLETE';
}
