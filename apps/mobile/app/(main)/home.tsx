import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

const MOCK_ROOMS: any[] = [];

export default function HomeScreen() {
  const hasRooms = MOCK_ROOMS.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoMark}
            />
            <Text style={styles.appName}>ReStructure</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} activeOpacity={0.7}>
            <Text style={styles.profileInitial}>S</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero ── */}
        <LinearGradient
          colors={['#1E1B4B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.decoBall1} />
          <View style={styles.decoBall2} />

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>✦  AI 배치 추천</Text>
          </View>

          <Text style={styles.heroTitle}>
            당신의 방을{'\n'}
            <Text style={styles.heroTitleAccent}>새롭게 재구성</Text>하세요
          </Text>

          <Text style={styles.heroSub}>
            방을 스캔하면 AI가 최적의{'\n'}가구 배치 3가지를 제안해드려요
          </Text>
        </LinearGradient>

        {/* ── 내 방 섹션 ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 방</Text>
            {hasRooms && (
              <TouchableOpacity>
                <Text style={styles.sectionLink}>전체보기 →</Text>
              </TouchableOpacity>
            )}
          </View>

          {hasRooms ? (
            MOCK_ROOMS.map((room) => (
              <View key={room.id} style={styles.roomCard}>
                <Text style={styles.roomName}>{room.name}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <LinearGradient
                colors={[colors.primaryDim, 'transparent']}
                style={styles.emptyIconWrap}
              >
                <Text style={styles.emptyIcon}>🏠</Text>
              </LinearGradient>
              <Text style={styles.emptyTitle}>등록된 방이 없어요</Text>
              <Text style={styles.emptyDesc}>
                아래 버튼을 눌러 방 스캔을 시작하거나{'\n'}사진으로 배치를 설계해보세요
              </Text>
            </View>
          )}
        </View>

        {/* ── 사용 방법 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이렇게 사용해요</Text>
          <View style={styles.stepsRow}>
            {[
              { num: '01', icon: '📷', label: '방 스캔', desc: '카메라로 촬영' },
              { num: '02', icon: '✏️', label: '도면 수정', desc: '벽·가구 편집' },
              { num: '03', icon: '✨', label: 'AI 추천', desc: '3가지 제안' },
            ].map((step, i) => (
              <View key={i} style={styles.stepCard}>
                <Text style={styles.stepNum}>{step.num}</Text>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── 하단 CTA ── */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaTouchable}
          onPress={() => router.push('/(main)/scan')}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>+ 새 방 스캔 시작</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={() => router.push('/(main)/room-editor')}
        >
          <Text style={styles.ctaSecondaryText}>사진으로 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 22,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 26, height: 26, borderRadius: 8 },
  appName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },

  // Hero
  heroBanner: {
    borderRadius: 20,
    padding: 26,
    marginBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
    minHeight: 200,
  },
  decoBall1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(129,140,248,0.08)',
    right: -50,
    top: -50,
  },
  decoBall2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(52,211,153,0.07)',
    right: 20,
    bottom: -30,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(129,140,248,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.35)',
  },
  heroBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#A5B4FC',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  heroTitleAccent: { color: '#A5B4FC' },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.primary,
  },

  // Room card (방이 있을 때)
  roomCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 30 },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Steps
  stepsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stepCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNum: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.primary,
    marginBottom: 10,
    letterSpacing: 1,
  },
  stepIcon: { fontSize: 24, marginBottom: 8 },
  stepLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  stepDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // CTA
  ctaWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: `${colors.bg}F5`,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  ctaTouchable: { borderRadius: 14, overflow: 'hidden' },
  ctaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ctaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: -0.2,
  },
  ctaSecondary: { alignItems: 'center', paddingVertical: 4 },
  ctaSecondaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
