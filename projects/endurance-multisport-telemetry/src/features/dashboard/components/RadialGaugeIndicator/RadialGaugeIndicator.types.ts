import type { LoadStatus } from '../../../../shared/models/load-status';

export type RadialGaugeIndicatorProps = {
  targetLoadPct: number;
  intervalPct: number;
  status: LoadStatus;
};
