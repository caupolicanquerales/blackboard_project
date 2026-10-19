export interface TrainingRatio {
  id: string;
  primaryPercentage: number;
  secondaryPercentage: number;
  categoryLabel: string;
}

export interface GaugeValue {
  id: string;
  label: string;
  percentage: number;
}
