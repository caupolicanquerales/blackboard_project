export interface AthleteProfile {
  id: string;
  displayName: string;
  role: 'ATHLETE' | 'COACH';
  avatarUri: string;
  activeSport: string;
  weightKg: number;
  restingHeartRate: number;
  maxHeartRate: number;
  ftpWatts: number;
}
