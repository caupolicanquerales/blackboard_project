import type { NavigationProp } from '@react-navigation/native';
import type { PatientPortalStackParamList } from '../../../../core/navigation/types';
import type { LoadStatus } from '../../../../shared/models/common';

export type PatientPortalNavigationProp = NavigationProp<
  PatientPortalStackParamList,
  'PatientPortalHome'
>;

export type PatientPortalTab = 'appointments' | 'prescriptions' | 'orders';

export type PatientPortalScreenState = LoadStatus;
