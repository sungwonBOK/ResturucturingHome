import { readFileSync, readdirSync } from 'node:fs';

const initialSchema = readFileSync('../../supabase/migrations/001_initial_schema.sql', 'utf8');
const allMigrations = readdirSync('../../supabase/migrations')
  .filter((fileName) => fileName.endsWith('.sql'))
  .sort()
  .map((fileName) => readFileSync(`../../supabase/migrations/${fileName}`, 'utf8'))
  .join('\n');
const activeSqlLines = initialSchema
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('--'));

assertActiveSqlLine('alter table public.rooms enable row level security;');
assertActiveSqlLine('alter table public.recommendations enable row level security;');
assertIncludes(allMigrations, 'revoke all on table public.rooms from anon;');
assertIncludes(allMigrations, 'revoke all on table public.recommendations from anon;');
assertIncludes(allMigrations, 'to authenticated');
assertIncludes(allMigrations, 'with check ((select auth.uid()) = user_id)');

function assertActiveSqlLine(expected: string) {
  if (!activeSqlLines.includes(expected)) {
    throw new Error(`Expected active SQL line: ${expected}`);
  }
}

function assertIncludes(source: string, expected: string) {
  if (!source.includes(expected)) {
    throw new Error(`Expected migrations to include: ${expected}`);
  }
}
