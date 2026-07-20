#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Detect if running in development or production
const isDev = process.env.NODE_ENV === 'development' || !existsSync(resolve(__dirname, '../dist'));

// In production, use compiled JS. In dev, use TS with tsx
const cliPath = isDev
  ? resolve(__dirname, '../src/cli/cli.ts')
  : resolve(__dirname, '../dist/cli/cli.js');

// In production, execute directly with node
if (!isDev) {
  import(cliPath).then(() => {}).catch(err => {
    console.error('Failed to load muitto:', err.message);
    process.exit(1);
  });
} else {
  // In development, use tsx
  const child = spawn('node', ['--import', 'tsx/esm', cliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
