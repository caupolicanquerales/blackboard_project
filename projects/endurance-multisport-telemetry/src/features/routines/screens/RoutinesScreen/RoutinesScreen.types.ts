import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RoutinesStackParamList } from '../../../../core/navigation/types';

export type RoutinesScreenProps = NativeStackScreenProps<RoutinesStackParamList, 'RoutinesList'>;

export type RoutinesScreenNavigationProp = NativeStackNavigationProp<RoutinesStackParamList, 'RoutinesList'>;
