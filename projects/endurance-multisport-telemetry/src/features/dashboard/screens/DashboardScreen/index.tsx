import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { config } from '../../../../core/config';
import { useWorkoutStore } from '../../../../core/store/workout.store';
import { BottomActionBar } from '../../../../shared/components/BottomActionBar';
import { HorizontalStepperTimeline } from '../../../../shared/components/HorizontalStepperTimeline';
import { IntervalExerciseCards } from '../../../../shared/components/IntervalExerciseCards';
import { useResponsiveLayout } from '../../../../shared/hooks/useResponsiveLayout';
import { theme } from '../../../../shared/theme/tokens';
import { BiometricTelemetryCards } from '../../components/BiometricTelemetryCards';
import { ComparisonSplitBars } from '../../components/ComparisonSplitBars';
import { LiveTelemetryStatisticsBar } from '../../components/LiveTelemetryStatisticsBar';
import { RadialGaugeIndicator } from '../../components/RadialGaugeIndicator';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { DashboardScreenNavigationProp } from './DashboardScreen.types';

export function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { metric, ratios, steps, phases, gauges, status, refreshing, onRefresh, onReset } = useDashboardData();
  const completeStep = useWorkoutStore((s) => s.completeStep);
  const advancePhase = useWorkoutStore((s) => s.advancePhase);
  const { size } = useResponsiveLayout();
  const isMedium = size === 'medium';

  const handleStartRoutine = useCallback(() => {
    navigation.navigate('Routines');
  }, [navigation]);
  const handleMetricPress = useCallback(() => {
    navigation.navigate('Routines');
  }, [navigation]);
  const handleComplete = useCallback((id: string) => void completeStep(id), [completeStep]);
  const handleAdvance = useCallback(() => void advancePhase(), [advancePhase]);
  const handleReset = useCallback(() => void onReset(), [onReset]);
  const handleRefresh = useCallback(() => void onRefresh(), [onRefresh]);
  const handleStepPress = useCallback(() => undefined, []);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={theme.colors.accent}
      colors={[theme.colors.accent]}
      accessibilityLabel="Pull to refresh dashboard"
    />
  );

  return (
    <SafeAreaView style={styles.root} testID="dashboard-screen">
      <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl}>
        <Text style={styles.title} accessibilityRole="header">
          Dashboard
        </Text>
        {status === 'loading' && (
          <View style={styles.center} accessibilityLiveRegion="polite">
            <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Loading dashboard" />
          </View>
        )}
        {status === 'error' && (
          <View style={styles.center} accessibilityRole="alert">
            <Text style={styles.errorText}>Failed to load telemetry</Text>
            <Pressable
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
              onPress={handleRefresh}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </View>
        )}
        {status === 'empty' && (
          <View style={styles.center}>
            <Text style={styles.muted}>No telemetry available</Text>
          </View>
        )}
        {status === 'success' && (
          <>
            <LiveTelemetryStatisticsBar
              metric={metric}
              status={status}
              maxHeartRate={config.MAX_HEART_RATE_BPM}
              maxPower={config.MAX_POWER_WATTS}
            />
            <View style={[styles.section, isMedium && styles.sectionRow]}>
              <View style={isMedium && styles.cell}>
                <BiometricTelemetryCards metric={metric} status={status} onPressMetric={handleMetricPress} />
              </View>
              <View style={isMedium && styles.cell}>
                <ComparisonSplitBars ratios={ratios} status={status} />
              </View>
              <View style={isMedium && styles.cell}>
                <RadialGaugeIndicator
                  targetLoadPct={gauges.targetLoadPct}
                  intervalPct={gauges.intervalPct}
                  status={status}
                />
              </View>
            </View>
            <HorizontalStepperTimeline steps={phases} onPressStep={handleStepPress} />
            <IntervalExerciseCards items={steps} status={status} onComplete={handleComplete} />
            <BottomActionBar
              primaryLabel="Start routine"
              onPrimary={handleStartRoutine}
              secondaryActions={[
                { id: 'advance-phase', label: 'Next phase', onPress: handleAdvance },
                { id: 'reset-ratios', label: 'Reset ratios', onPress: handleReset },
              ]}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, alignItems: 'stretch', flexWrap: 'nowrap' },
  title: { ...theme.typography.headingStyle, color: theme.colors.text, fontSize: theme.typography.fontSizes.heading },
  section: { gap: theme.spacing.lg },
  sectionRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexGrow: 1, flexBasis: '45%' },
  center: { alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg },
  muted: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.body },
  errorText: { color: theme.colors.error, fontSize: theme.typography.fontSizes.body },
  button: {
    minHeight: theme.minTouchTarget,
    minWidth: theme.minTouchTarget,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  buttonText: { ...theme.typography.headingStyle, color: theme.colors.onAccent, fontSize: theme.typography.fontSizes.body },
});
