import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DashboardStackParamList, RootTabParamList } from '../../../../core/navigation/types';

export type DashboardScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;
