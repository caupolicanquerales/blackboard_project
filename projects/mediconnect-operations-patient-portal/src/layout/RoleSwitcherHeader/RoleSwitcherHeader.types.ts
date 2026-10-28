import type { ProfileView } from '../../shared/models/common';

export type RoleSwitcherHeaderProps = {
  activeView: ProfileView;
  location: string;
  pendingNotificationCount: number;
  onSwitch: (view: ProfileView) => void;
};
