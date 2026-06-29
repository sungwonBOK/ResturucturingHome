const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// packages/domain 등 워크스페이스 파일 변경 감지
config.watchFolders = [monorepoRoot];

// pnpm hoisted: 모든 패키지는 루트 node_modules에 단 하나씩 설치됨
// apps/mobile 먼저, 없으면 루트에서 찾음
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;

