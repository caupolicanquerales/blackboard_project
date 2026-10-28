import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ClinicalAgendaStackParamList } from '../../../../core/navigation/types';

export type AppointmentModifierScreenProps = NativeStackScreenProps<
  ClinicalAgendaStackParamList,
  'AppointmentModifier'
>;

export type AppointmentModifierViewState = 'loading' | 'empty' | 'error' | 'success';

export type SlotOption = {
  time: string;
  blocked: boolean;
};
