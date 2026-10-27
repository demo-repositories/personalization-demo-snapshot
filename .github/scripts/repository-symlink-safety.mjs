import { realpathSync } from 'node:fs';
import path from 'node:path';

function isWithinRepository(repositoryRoot, target) {
  const relative = path.relative(repositoryRoot, target);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/** Verify that a symlink cannot escape the repository protection boundary. */
export function assertSafeInternalSymlink(absolute, repositoryRoot) {
  let target;
  try {
    target = realpathSync(absolute);
  } catch {
    throw new Error('REPAIR_SOURCE_MUTATED');
  }
  if (!isWithinRepository(repositoryRoot, target)) throw new Error('REPAIR_SOURCE_MUTATED');
}
