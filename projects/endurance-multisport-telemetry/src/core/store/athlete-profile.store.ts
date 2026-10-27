import { create } from 'zustand';
import type { AthleteProfile } from '../models/athlete-profile';
import { athleteService } from '../services/athlete.service';

export type AthleteProfileStatus = 'idle' | 'loading' | 'success' | 'error';

interface AthleteProfileState {
  profile: AthleteProfile | null;
  status: AthleteProfileStatus;
  error?: string;
  loadProfile: () => Promise<void>;
  setProfile: (p: AthleteProfile) => void;
  signOut: () => void;
}

export const useAthleteProfileStore = create<AthleteProfileState>()((set) => ({
  profile: null,
  status: 'idle',
  error: undefined,
  loadProfile: async () => {
    set({ status: 'loading', error: undefined });
    try {
      const profile = await athleteService.fetchProfile();
      set({ profile, status: 'success' });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to load profile',
      });
    }
  },
  setProfile: (p) => set({ profile: p, status: 'success', error: undefined }),
  signOut: () => set({ profile: null, status: 'idle', error: undefined }),
}));
