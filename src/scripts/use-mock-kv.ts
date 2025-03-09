/**
 * This script modifies the Twitter monitoring API endpoint to use the mock KV implementation
 * instead of the real Vercel KV client. This is useful for local development without
 * requiring the Vercel CLI or a Vercel KV database.
 * 
 * Usage:
 * 1. Run: npx ts-node --project tsconfig.json src/scripts/use-mock-kv.ts
 * 2. To switch back to the real KV implementation, run: npx ts-node --project tsconfig.json src/scripts/use-real-kv.ts
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
  `import { kv } from '@vercel/kv';`,
  `import { kv } from '@/lib/kv/mock';`
);

// Replace imports in dashboard.ts
replaceInFile(
  dashboardPath,
  `import { kv } from '@vercel/kv';`,
  `import { kv } from '@/lib/kv/mock';`
);

// Replace imports in utils.ts
replaceInFile(
  utilsPath,
  `import { kv } from '@vercel/kv';`,
  `import { kv } from '@/lib/kv/mock';`
);

console.log('Switched to mock KV implementation for local development');
console.log('To switch back to the real KV implementation, run: npx ts-node --project tsconfig.json src/scripts/use-real-kv.ts');