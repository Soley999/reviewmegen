import { config } from './src/config.js';

const key = config.gemini.apiKey;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`;

const res = await fetch(url);
const data = await res.json();

if (!res.ok) {
  console.error('ERROR:', JSON.stringify(data, null, 2));
  process.exit(1);
}

// Filter to models that support generateContent and contain "flash" or "pro"
const usable = (data.models || []).filter(m =>
  m.supportedGenerationMethods?.includes('generateContent')
);

console.log('All generateContent-capable models:\n');
for (const m of usable) {
  console.log(`  ${m.name}  (display: ${m.displayName})`);
}

// Specifically flag flash models
console.log('\nFlash models only:');
for (const m of usable) {
  if (m.name.toLowerCase().includes('flash')) {
    console.log(`  ✓ ${m.name}  — ${m.displayName}`);
  }
}
