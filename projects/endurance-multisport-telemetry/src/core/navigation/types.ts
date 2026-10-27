export type RootTabParamList = {
  Dashboard: undefined;
  Routines: undefined;
  Profile: undefined;
};

export type RoutinesStackParamList = {
  RoutinesList: undefined;
  WorkoutDetail: { routineId: string; stepId: string };
  ActiveExecution: { routineId: string };
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
};
