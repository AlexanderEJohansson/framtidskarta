#!/usr/bin/env node
// Ensures tailwindcss and autoprefixer are present after npm install
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tailwindDir = path.join(__dirname, '..', 'node_modules', 'tailwindcss');
const autoprefixerDir = path.join(__dirname, '..', 'node_modules', 'autoprefixer');

if (!fs.existsSync(tailwindDir) || !fs.existsSync(path.join(tailwindDir, 'package.json'))) {
  console.log('[postinstall] tailwindcss missing, installing...');
  execSync('curl -fsSL https://registry.npmjs.org/tailwindcss/-/tailwindcss-3.4.19.tgz -o /tmp/tw.tgz', { stdio: 'pipe' });
  execSync('mkdir -p node_modules/tailwindcss && tar -xzf /tmp/tw.tgz -C node_modules/tailwindcss --strip-components=1', { stdio: 'pipe' });
  console.log('[postinstall] tailwindcss installed');
}

if (!fs.existsSync(autoprefixerDir)) {
  console.log('[postinstall] autoprefixer missing, installing...');
  execSync('curl -fsSL https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.5.0.tgz -o /tmp/ap.tgz', { stdio: 'pipe' });
  execSync('mkdir -p node_modules/autoprefixer && tar -xzf /tmp/ap.tgz -C node_modules/autoprefixer --strip-components=1', { stdio: 'pipe' });
  // Install autoprefixer deps
  const deps = ['browserslist', 'caniuse-lite', 'fraction.js', 'postcss-value-parser'];
  for (const dep of deps) {
    const dir = path.join(__dirname, '..', 'node_modules', dep);
    if (!fs.existsSync(dir)) {
      try {
        execSync(`npm install --no-save ${dep}`, { stdio: 'pipe' });
      } catch(e) {}
    }
  }
  console.log('[postinstall] autoprefixer installed');
}
