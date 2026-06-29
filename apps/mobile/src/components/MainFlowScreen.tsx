import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface FlowStep {
  label: string;
  description: string;
}

interface MainFlowScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  steps: FlowStep[];
  children?: ReactNode;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}

export function MainFlowScreen({
  eyebrow,
  title,
  description,
  steps,
  children,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: MainFlowScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.panel}>
          {steps.map((step, index) => (
            <View key={step.label} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {children}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity activeOpacity={0.85} onPress={onPrimaryPress}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {secondaryLabel && onSecondaryPress ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryPress}>
            <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 22, paddingBottom: 132 },
  header: { paddingTop: 18, marginBottom: 24 },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  panel: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
    gap: 16,
  },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDim,
  },
  stepNumberText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.primary,
  },
  stepTextWrap: { flex: 1 },
  stepLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    backgroundColor: `${colors.bg}F5`,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  secondaryButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
