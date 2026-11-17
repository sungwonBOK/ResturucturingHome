import AsyncStorage from '@react-native-async-storage/async-storage';
import { createScanDraftRepository } from './scanDraft';

const DRAFT_STORAGE_KEY = 'restructure.latestDraft';

// 앱 전체가 함께 쓰는 초안 저장소. 마지막 초안을 기기에 저장해 앱을 다시 켜도 이어서 편집할 수 있습니다.
export const scanDraftRepository = createScanDraftRepository({
  storage: {
    load: () => AsyncStorage.getItem(DRAFT_STORAGE_KEY),
    save: (value) => AsyncStorage.setItem(DRAFT_STORAGE_KEY, value),
  },
});
