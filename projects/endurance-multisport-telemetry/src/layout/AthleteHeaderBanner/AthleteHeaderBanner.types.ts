import type { AthleteProfile } from '../../core/models/athlete-profile';
import type { LoadStatus } from '../../shared/models/load-status';

export type AthleteHeaderBannerProps = {
  profile: AthleteProfile | null;
  status: LoadStatus;
  onPressSync: () => void;
  onPressAvatar: () => void;
};
