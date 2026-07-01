/** CI runs against mocks; local runs hit the live API unless MOCK_API=true. */
export function isMockApiEnabled(): boolean {
  if (process.env.MOCK_API === 'true') return true;
  if (process.env.MOCK_API === 'false') return false;
  return process.env.CI === 'true';
}
