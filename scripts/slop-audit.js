import fs from 'fs';
import path from 'path';

const srcDir = 'c:\\Users\\johnc\\OneDrive\\Desktop\\esp calc\\src';

// Regex for emoji detection
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;

// Regex for banned fonts
const bannedFonts = ['Inter', 'Roboto', 'Arial', 'system-ui'];

function scanDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDir(fullPath, results);
      }
    } else if (/\.(tsx?|css|html)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = scanDir(srcDir);
let emojiViolations = 0;
let fontViolations = 0;

console.log(`Auditing ${files.length} source files for Anti-Slop compliance...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(srcDir, file);

  // Check for emojis
  const emojiMatches = content.match(emojiRegex);
  if (emojiMatches) {
    console.error(`[EMOJI VIOLATION] ${relPath}: found emojis ${emojiMatches.join(' ')}`);
    emojiViolations++;
  }

  // Check for banned font references
  for (const font of bannedFonts) {
    // allow font-family declaration in index.css only if overridden or not present
    if (file.endsWith('.css')) {
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes(font) && !line.includes('/*')) {
          console.error(`[FONT VIOLATION] ${relPath}:${i + 1}: contains banned font "${font}"`);
          fontViolations++;
        }
      });
    } else if (content.includes(`"${font}"`) || content.includes(`'${font}'`)) {
      console.error(`[FONT VIOLATION] ${relPath}: references banned font "${font}"`);
      fontViolations++;
    }
  }
}

console.log(`\nAudit Results:`);
console.log(`Emoji violations: ${emojiViolations}`);
console.log(`Font violations: ${fontViolations}`);

if (emojiViolations === 0 && fontViolations === 0) {
  console.log('ALL ANTI-SLOP CHECKS PASSED 100%!');
} else {
  process.exit(1);
}
