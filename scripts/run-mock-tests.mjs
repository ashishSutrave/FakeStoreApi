process.env.MOCK_API = 'true';
process.env.CI = 'false';

import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const result = spawnSync('npx', ['playwright', 'test', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
