/**
 * This script modifies the Twitter monitoring API endpoint to use the real Vercel KV client
 * instead of the mock KV implementation. This is useful when you want to switch back
 * to using the real Vercel KV database after using the mock implementation.
 * 
 * Usage:
 * 1. Run: npx ts-node --project tsconfig.json src/scripts/use-real-kv.ts
 * 2. To switch to the mock KV implementation, run: npx ts-node --project tsconfig.json src/scripts/use-mock-kv.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const monitorPath = path.resolve('src/pages/api/twitter/monitor.ts');
const dashboardPath = path.resolve('src/pages/api/twitter/dashboard.ts');
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
  `import { kv } from '@/lib/kv/mock';`,
  `import { kv } from '@vercel/kv';`
);

// Replace imports in dashboard.ts
replaceInFile(
  dashboardPath,
  `import { kv } from '@/lib/kv/mock';`,
  `import { kv } from '@vercel/kv';`
);

// Replace imports in utils.ts
replaceInFile(
  utilsPath,
  `import { kv } from '@/lib/kv/mock';`,
  `import { kv } from '@vercel/kv';`
);

console.log('Switched to real Vercel KV implementation');
console.log('To switch to the mock KV implementation, run: npx ts-node --project tsconfig.json src/scripts/use-mock-kv.ts');