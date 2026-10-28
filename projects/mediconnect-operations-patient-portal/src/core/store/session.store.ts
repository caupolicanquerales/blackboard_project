import { create } from 'zustand';

import { accessControlService } from '../services/access-control.service';
import type { AccessContext, AccessResource, TabRouteName } from '../services/access-control.service';
import { useNotificationsStore } from './notifications.store';
import type { ProfileView, Role } from '../../shared/models/common';

interface SessionState {
  role: Role;
  profileView: ProfileView;
  location: string;
  pendingNotificationCount: number;
  tabs: TabRouteName[];
  switchProfileView: (view: ProfileView) => void;
  setRole: (role: Role) => void;
  canAccess: (resource: AccessResource, field: string, context?: AccessContext) => boolean;
}

const DEFAULT_ROLE_BY_VIEW: Record<ProfileView, Role> = {
  patient: 'PATIENT_SOCIAL_SECURITY',
  doctor: 'DOCTOR',
  staff: 'SECRETARY',
};

const DEFAULT_ROLE: Role = 'DOCTOR';

export const useSessionStore = create<SessionState>()((set, get) => ({
  role: DEFAULT_ROLE,
  profileView: accessControlService.getProfileView(DEFAULT_ROLE),
  location: 'Madrid Central Clinic',
  pendingNotificationCount: useNotificationsStore.getState().pendingCallCount,
  tabs: accessControlService.getTabsForRole(DEFAULT_ROLE),

  switchProfileView(view) {
    get().setRole(DEFAULT_ROLE_BY_VIEW[view]);
  },

  setRole(role) {
    set({
      role,
      profileView: accessControlService.getProfileView(role),
      tabs: accessControlService.getTabsForRole(role),
    });
  },

  canAccess(resource, field, context) {
    return accessControlService.canAccessField(get().role, resource, field, context);
  },
}));

// Keep the badge count in sync with the notifications store.
useNotificationsStore.subscribe((state) => {
  const count = state.pendingCallCount;
  if (useSessionStore.getState().pendingNotificationCount !== count) {
    useSessionStore.setState({ pendingNotificationCount: count });
  }
});
