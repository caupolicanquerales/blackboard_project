import { apiClient } from '../api/api-client';
import type { AthleteProfile } from '../models/athlete-profile';

export const athleteService = {
  fetchProfile(): Promise<AthleteProfile> {
    return apiClient.request<AthleteProfile>('GET', '/athlete/profile');
  },
};
