/**
 * This script modifies the Twitter monitoring API endpoint to use the real Upstash Redis client
 * instead of the mock Redis implementation. This is useful when you want to switch back
 * to using the real Upstash Redis database after using the mock implementation.
 * 
 * Usage:
 * 1. Run: npx ts-node --project tsconfig.json src/scripts/use-real-redis.ts
 * 2. To switch to the mock Redis implementation, run: npx ts-node --project tsconfig.json src/scripts/use-mock-redis.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const monitorPath = path.resolve('src/pages/api/twitter/monitor.ts');
const utilsPath = path.resolve('src/lib/twitter/utils.ts');

function replaceInFile(filePath: string, search: string, replace: string) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes(search)) {
      console.log(`No changes needed in ${filePath}`);
      return false;
    }
    
    const newContent = content.replace(search, replace);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Replace imports in monitor.ts
replaceInFile(
  monitorPath,
  `import { redis } from '@/lib/redis/mock';`,
  `import { redis } from '@/lib/redis';`
);

// Replace imports in utils.ts
replaceInFile(
  utilsPath,
  `import { redis } from '@/lib/redis/mock';`,
  `import { redis } from '@/lib/redis';`
);

console.log('Switched to real Upstash Redis implementation');
console.log('To switch to the mock Redis implementation, run: npx ts-node --project tsconfig.json src/scripts/use-mock-redis.ts');