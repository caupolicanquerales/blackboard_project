import type { IntervalCardItem } from '../../models/interval-card-item';
import type { LoadStatus } from '../../models/load-status';

export type IntervalExerciseCardsProps = {
  items: IntervalCardItem[];
  status: LoadStatus;
  onComplete: (id: string) => void;
};
