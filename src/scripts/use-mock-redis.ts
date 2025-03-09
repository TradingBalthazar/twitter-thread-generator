/**
 * This script modifies the Twitter monitoring API endpoint to use the mock Redis implementation
 * instead of the real Upstash Redis client. This is useful for local development without
 * requiring an Upstash Redis database.
 * 
 * Usage:
 * 1. Run: npx ts-node --project tsconfig.json src/scripts/use-mock-redis.ts
 * 2. To switch back to the real Redis implementation, run: npx ts-node --project tsconfig.json src/scripts/use-real-redis.ts
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
  `import { redis } from '@/lib/redis';`,
  `import { redis } from '@/lib/redis/mock';`
);

// Replace imports in utils.ts
replaceInFile(
  utilsPath,
  `import { redis } from '@/lib/redis';`,
  `import { redis } from '@/lib/redis/mock';`
);

console.log('Switched to mock Redis implementation for local development');
console.log('To switch back to the real Redis implementation, run: npx ts-node --project tsconfig.json src/scripts/use-real-redis.ts');