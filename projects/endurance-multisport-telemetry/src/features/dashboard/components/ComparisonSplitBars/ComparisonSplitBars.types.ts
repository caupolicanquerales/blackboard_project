import type { TrainingRatio } from '../../../../core/models/training-ratio';
import type { LoadStatus } from '../../../../shared/models/load-status';

export type ComparisonSplitBarsProps = {
  ratios: TrainingRatio[];
  status: LoadStatus;
};
