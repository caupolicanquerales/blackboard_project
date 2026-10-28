export type ClinicalAgendaStackParamList = {
  ClinicalAgendaHome: undefined;
  AppointmentModifier: { appointmentId: string };
};

export type PatientPortalStackParamList = {
  PatientPortalHome: undefined;
  PrescriptionDetail: { prescriptionId: string };
};

export type MessagingHubStackParamList = {
  MessagingHubHome: undefined;
};

export type FinancialLedgerStackParamList = {
  FinancialLedgerHome: undefined;
  ReceiptScanner: undefined;
};

export type RootStackParamList = {
  ClinicalAgenda: undefined;
  PatientPortal: undefined;
  MessagingHub: undefined;
  FinancialLedger: undefined;
};
