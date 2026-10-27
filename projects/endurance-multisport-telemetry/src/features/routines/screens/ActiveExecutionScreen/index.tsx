import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RoutinesStackParamList } from '../../../../core/navigation/types';
import { BottomActionBar } from '../../../../shared/components/BottomActionBar';
import { HorizontalStepperTimeline } from '../../../../shared/components/HorizontalStepperTimeline';
import { IntervalExerciseCards } from '../../../../shared/components/IntervalExerciseCards';
import { theme } from '../../../../shared/theme/tokens';
import { useRoutineExecution } from '../../hooks/useRoutineExecution';
import type { ActiveExecutionScreenNavigationProp } from './ActiveExecutionScreen.types';

export function ActiveExecutionScreen() {
  const navigation = useNavigation<ActiveExecutionScreenNavigationProp>();
  const route = useRoute<RouteProp<RoutinesStackParamList, 'ActiveExecution'>>();
  const { timelineSteps, cardItems, status, activeStep, onCompleteStep, onAdvancePhase, canAdvance } =
    useRoutineExecution(route.params?.routineId);

  const handleComplete = useCallback((id: string) => void onCompleteStep(id), [onCompleteStep]);
  const handleStepPress = useCallback(
    (stepId: string) => navigation.navigate('WorkoutDetail', { routineId: route.params.routineId, stepId }),
    [navigation, route.params],
  );
  const handlePrimary = useCallback(() => {
    if (activeStep) void onCompleteStep(activeStep.id);
  }, [activeStep, onCompleteStep]);
  const handleAdvance = useCallback(() => {
    void onAdvancePhase().then(() => {
      Alert.alert('Phase complete', 'Moving on to the next phase.');
    });
  }, [onAdvancePhase]);

  const secondaryActions = useMemo(
    () => [{ id: 'advance-phase', label: 'Advance phase', onPress: handleAdvance, disabled: !canAdvance }],
    [handleAdvance, canAdvance],
  );

  return (
    <SafeAreaView style={styles.root} testID="active-execution-screen">
      <Text style={styles.title} accessibilityRole="header">
        Active execution
      </Text>
      {status === 'loading' && (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Loading routine" />
        </View>
      )}
      {status === 'error' && (
        <View style={styles.center} accessibilityRole="alert">
          <Text style={styles.message}>Could not load the routine.</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.back}
          >
            <Text style={styles.backText}>Go back</Text>
          </Pressable>
        </View>
      )}
      {status === 'empty' && (
        <View style={styles.center}>
          <Text style={styles.message}>No steps in this routine.</Text>
        </View>
      )}
      {status === 'success' && (
        <>
          <ScrollView contentContainerStyle={styles.content} style={styles.flex}>
            <HorizontalStepperTimeline steps={timelineSteps} onPressStep={handleStepPress} />
            <IntervalExerciseCards items={cardItems} status={status} onComplete={handleComplete} />
          </ScrollView>
          <BottomActionBar
            primaryLabel={activeStep ? 'Complete step' : 'All steps done'}
            onPrimary={handlePrimary}
            primaryDisabled={!activeStep}
            secondaryActions={secondaryActions}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: { gap: 12, padding: theme.spacing.lg, alignItems: 'stretch' },
  title: {
    ...theme.typography.headingStyle,
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.heading,
    padding: theme.spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.body },
  back: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
  },
  backText: { color: theme.colors.onAccent, fontWeight: '700' },
});
