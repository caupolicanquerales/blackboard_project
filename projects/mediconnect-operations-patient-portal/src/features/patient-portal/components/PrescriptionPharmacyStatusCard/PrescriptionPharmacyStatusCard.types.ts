import type { Prescription } from '../../../../shared/models/patient';

export type PrescriptionPharmacyStatusCardProps = {
  prescription: Prescription;
  onPress: (prescription: Prescription) => void;
};
