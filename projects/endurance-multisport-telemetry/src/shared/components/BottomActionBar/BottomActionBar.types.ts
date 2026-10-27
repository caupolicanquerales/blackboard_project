export type BottomActionBarSecondaryAction = {
  id: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export type BottomActionBarProps = {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryActions: BottomActionBarSecondaryAction[];
  primaryDisabled?: boolean;
};
