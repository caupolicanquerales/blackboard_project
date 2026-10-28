export type InsuranceType = 'SOCIAL_SECURITY' | 'PRIVATE';

export interface PatientRecord {
  id: string;
  fullName: string;
  insuranceType: InsuranceType;
  insuranceNumber: string;
}

export type PharmacyStatus = 'PENDING' | 'SENT_TO_PHARMACY' | 'READY_FOR_PICKUP';

export interface Prescription {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  pharmacyStatus: PharmacyStatus;
  issuedAt: string;
  issuingDoctor: string;
}

export type MedicalOrderType = 'SPECIALIST_REFERRAL' | 'LAB_EXAM';
export type MedicalOrderStatus = 'REQUESTED' | 'SCHEDULED' | 'COMPLETED';

export interface MedicalOrder {
  id: string;
  patientId: string;
  orderType: MedicalOrderType;
  description: string;
  targetSpecialty: string | undefined;
  status: MedicalOrderStatus;
}
