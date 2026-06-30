import type { RoomFloorPlan } from '@restructuring-home/domain';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { roomPersistence, type SavedRoom } from '../../services/roomPersistence';

interface RoomPersistencePanelProps {
  plan: RoomFloorPlan;
}

type PersistenceStatus = 'idle' | 'saving' | 'loading' | 'saved' | 'loaded' | 'error';

export function RoomPersistencePanel({ plan }: RoomPersistencePanelProps) {
  const [savedRoom, setSavedRoom] = useState<SavedRoom | null>(null);
  const [loadedRoom, setLoadedRoom] = useState<SavedRoom | null>(null);
  const [status, setStatus] = useState<PersistenceStatus>('idle');
  const [message, setMessage] = useState('Supabase rooms 저장을 아직 실행하지 않았습니다.');

  const handleSave = async () => {
    setStatus('saving');
    setMessage('도면을 Supabase rooms에 저장하는 중입니다.');

    try {
      const nextRoom = await roomPersistence.saveRoomFloorPlan({
        name: '테스트 원룸',
        floorPlan: plan,
      });

      setSavedRoom(nextRoom);
      setLoadedRoom(null);
      setStatus('saved');
      setMessage(`저장 완료: ${nextRoom.name}`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '도면 저장 중 오류가 발생했습니다.');
    }
  };

  const handleLoad = async () => {
    if (!savedRoom) {
      return;
    }

    setStatus('loading');
    setMessage('저장된 도면을 다시 불러오는 중입니다.');

    try {
      const nextRoom = await roomPersistence.loadRoomFloorPlan(savedRoom.id);

      setLoadedRoom(nextRoom);
      setStatus('loaded');
      setMessage(`로드 완료: ${nextRoom.floorPlan.width}cm x ${nextRoom.floorPlan.height}cm`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '도면 로드 중 오류가 발생했습니다.');
    }
  };

  const isWorking = status === 'saving' || status === 'loading';
  const canLoad = Boolean(savedRoom) && !isWorking;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Supabase 저장 상태</Text>
        <Text style={[styles.badge, status === 'error' ? styles.errorBadge : null]}>{status}</Text>
      </View>

      <Text style={styles.message}>{message}</Text>

      {savedRoom ? (
        <Text style={styles.meta} numberOfLines={1}>
          room_id: {savedRoom.id}
        </Text>
      ) : null}

      {loadedRoom ? (
        <Text style={styles.meta} numberOfLines={1}>
          loaded_at: {loadedRoom.createdAt}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isWorking}
          onPress={handleSave}
          style={[styles.button, isWorking ? styles.disabledButton : null]}
        >
          <Text style={styles.buttonText}>{status === 'saving' ? '저장 중' : 'Mock 저장'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!canLoad}
          onPress={handleLoad}
          style={[styles.secondaryButton, !canLoad ? styles.disabledButton : null]}
        >
          <Text style={styles.secondaryButtonText}>{status === 'loading' ? '로드 중' : '다시 로드'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 16,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
  errorBadge: {
    backgroundColor: 'rgba(248,113,113,0.16)',
    color: colors.error,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  meta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
});
