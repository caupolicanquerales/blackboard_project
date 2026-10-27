import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RoutinesStackParamList } from '../../../../core/navigation/types';

export type WorkoutDetailScreenProps = NativeStackScreenProps<RoutinesStackParamList, 'WorkoutDetail'>;

export type WorkoutDetailScreenNavigationProp = NativeStackNavigationProp<RoutinesStackParamList, 'WorkoutDetail'>;
