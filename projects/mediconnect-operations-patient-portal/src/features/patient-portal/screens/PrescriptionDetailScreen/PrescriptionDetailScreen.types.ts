import type { RouteProp } from '@react-navigation/native';
import type { PatientPortalStackParamList } from '../../../../core/navigation/types';
import type { LoadStatus } from '../../../../shared/models/common';

export type PrescriptionDetailRouteProp = RouteProp<
  PatientPortalStackParamList,
  'PrescriptionDetail'
>;

export type PrescriptionDetailScreenState = LoadStatus;
