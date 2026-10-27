import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RoutinesStackParamList } from '../../../../core/navigation/types';

export type ActiveExecutionScreenProps = NativeStackScreenProps<RoutinesStackParamList, 'ActiveExecution'>;

export type ActiveExecutionScreenNavigationProp = NativeStackNavigationProp<RoutinesStackParamList, 'ActiveExecution'>;
