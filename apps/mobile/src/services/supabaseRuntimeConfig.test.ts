import { readFileSync } from 'node:fs';

const supabaseSource = readFileSync('src/services/supabase.ts', 'utf8');
const mobilePackage = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>;
};

assertIncludes(
  supabaseSource,
  "import 'react-native-url-polyfill/auto';",
  'Supabase React Native URL polyfill import',
);
assertIncludes(
  supabaseSource,
  "import AsyncStorage from '@react-native-async-storage/async-storage';",
  'Supabase React Native AsyncStorage import',
);
assertIncludes(supabaseSource, 'processLock', 'Supabase React Native processLock auth option');
assertIncludes(supabaseSource, 'AppState.addEventListener', 'Supabase auth auto refresh AppState listener');
assertIncludes(supabaseSource, "Platform.OS !== 'web'", 'Supabase AppState listener web guard');
assertIncludes(
  supabaseSource,
  "storage: AsyncStorage",
  'Supabase React Native auth storage must use AsyncStorage',
);

if (supabaseSource.includes('storage: ExpoSecureStoreAdapter')) {
  throw new Error('Supabase Auth storage must not write the whole session directly to Expo SecureStore');
}

if (!mobilePackage.dependencies?.['react-native-url-polyfill']) {
  throw new Error('mobile package must depend on react-native-url-polyfill');
}

if (!mobilePackage.dependencies?.['@react-native-async-storage/async-storage']) {
  throw new Error('mobile package must depend on @react-native-async-storage/async-storage');
}

function assertIncludes(source: string, expected: string, label: string) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: expected source to include ${expected}`);
  }
}
