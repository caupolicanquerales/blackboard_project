import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RoutinesStackParamList } from '../../../../core/navigation/types';
import { BottomActionBar } from '../../../../shared/components/BottomActionBar';
import { HorizontalStepperTimeline } from '../../../../shared/components/HorizontalStepperTimeline';
import { theme } from '../../../../shared/theme/tokens';
import { useRoutineExecution } from '../../hooks/useRoutineExecution';
import type { WorkoutDetailScreenNavigationProp } from './WorkoutDetailScreen.types';

const noop = () => undefined;
const NO_ACTIONS: { id: string; label: string; onPress: () => void }[] = [];

export function WorkoutDetailScreen() {
  const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
  const route = useRoute<RouteProp<RoutinesStackParamList, 'WorkoutDetail'>>();
  const { routineId, stepId } = route.params;
  const { timelineSteps, cardItems, status, onCompleteStep } = useRoutineExecution(routineId);

  const step = useMemo(() => cardItems.find((c) => c.id === stepId) ?? null, [cardItems, stepId]);

  const handleComplete = useCallback(() => {
    if (step && !step.isDone) void onCompleteStep(step.id);
  }, [step, onCompleteStep]);
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const backButton = (
    <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
      <Text style={styles.backText}>Go back</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} testID="workout-detail-screen">
      <Text style={styles.title} accessibilityRole="header">
        Step detail
      </Text>
      {status === 'loading' && (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Loading step" />
        </View>
      )}
      {status === 'error' && (
        <View style={styles.center} accessibilityRole="alert">
          <Text style={styles.message}>Could not load the step.</Text>
          {backButton}
        </View>
      )}
      {(status === 'empty' || (status === 'success' && !step)) && (
        <View style={styles.center}>
          <Text style={styles.message}>Step not found.</Text>
          {backButton}
        </View>
      )}
      {status === 'success' && step && (
        <>
          <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
            <HorizontalStepperTimeline steps={timelineSteps} onPressStep={noop} />
            <View
              style={styles.card}
              accessible
              accessibilityLabel={`Step ${step.stepNumber}, ${step.title}, target zone ${step.targetZone}, ${
                step.isDone ? 'completed' : 'not completed'
              }`}
            >
              <Text style={styles.stepNumber}>Step {step.stepNumber}</Text>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.body}>{step.description}</Text>
              <Text style={styles.zone}>Target zone: {step.targetZone}</Text>
              <Text style={[styles.state, step.isDone && styles.stateDone]}>
                {step.isDone ? 'Completed' : 'Pending'}
              </Text>
            </View>
          </ScrollView>
          <BottomActionBar
            primaryLabel={step.isDone ? 'Step completed' : 'Mark complete'}
            onPrimary={handleComplete}
            primaryDisabled={step.isDone}
            secondaryActions={NO_ACTIONS}
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
  card: { gap: 8, padding: theme.spacing.lg, borderRadius: theme.radii.md, backgroundColor: theme.colors.surface },
  stepNumber: { color: theme.colors.accent, fontWeight: '700' },
  cardTitle: { ...theme.typography.headingStyle, color: theme.colors.text, fontSize: theme.typography.fontSizes.heading },
  body: { color: theme.colors.text, fontSize: theme.typography.fontSizes.body },
  zone: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.body },
  state: { color: theme.colors.muted, fontWeight: '700' },
  stateDone: { color: theme.colors.accent },
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
