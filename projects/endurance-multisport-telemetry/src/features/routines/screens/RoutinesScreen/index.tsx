import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { config } from '../../../../core/config';
import { BottomActionBar } from '../../../../shared/components/BottomActionBar';
import { HorizontalStepperTimeline } from '../../../../shared/components/HorizontalStepperTimeline';
import { IntervalExerciseCards } from '../../../../shared/components/IntervalExerciseCards';
import type { IntervalCardItem } from '../../../../shared/models/interval-card-item';
import { theme } from '../../../../shared/theme/tokens';
import { useRoutineExecution } from '../../hooks/useRoutineExecution';
import type { RoutinesScreenNavigationProp } from './RoutinesScreen.types';

const ROUTINE_ID = config.DEFAULT_ROUTINE_ID;

export function RoutinesScreen() {
  const navigation = useNavigation<RoutinesScreenNavigationProp>();
  const { timelineSteps, cardItems, status, onCompleteStep } = useRoutineExecution(ROUTINE_ID);

  const openDetail = useCallback(
    (stepId: string) => navigation.navigate('WorkoutDetail', { routineId: ROUTINE_ID, stepId }),
    [navigation],
  );
  const handleComplete = useCallback((id: string) => void onCompleteStep(id), [onCompleteStep]);
  const handleStart = useCallback(
    () => navigation.navigate('ActiveExecution', { routineId: ROUTINE_ID }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: IntervalCardItem }) => (
      <Pressable
        onPress={() => openDetail(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${item.title}`}
        style={styles.row}
        testID={`routine-card-${item.id}`}
      >
        <IntervalExerciseCards items={[item]} status="success" onComplete={handleComplete} />
      </Pressable>
    ),
    [openDetail, handleComplete],
  );

  const header = useMemo(
    () => <HorizontalStepperTimeline steps={timelineSteps} onPressStep={openDetail} />,
    [timelineSteps, openDetail],
  );

  return (
    <SafeAreaView style={styles.root} testID="routines-screen">
      <Text style={styles.title} accessibilityRole="header">
        Routines
      </Text>
      {status === 'loading' && (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Loading routines" />
        </View>
      )}
      {status === 'error' && (
        <View style={styles.center} accessibilityRole="alert">
          <Text style={styles.message}>Could not load routines.</Text>
        </View>
      )}
      {status === 'empty' && (
        <View style={styles.center}>
          <Text style={styles.message}>No routines yet.</Text>
        </View>
      )}
      {status === 'success' && (
        <>
          <FlatList
            style={styles.flex}
            contentContainerStyle={styles.content}
            data={cardItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={header}
            initialNumToRender={8}
            windowSize={7}
            testID="routines-list"
          />
          <BottomActionBar
            primaryLabel="Start execution"
            onPrimary={handleStart}
            secondaryActions={[]}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: { gap: 12, padding: theme.spacing.lg },
  row: { alignSelf: 'stretch' },
  title: {
    ...theme.typography.headingStyle,
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.heading,
    padding: theme.spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { color: theme.colors.muted, fontSize: theme.typography.fontSizes.body },
});
