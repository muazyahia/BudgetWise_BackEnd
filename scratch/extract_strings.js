const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '..');
const results = new Set();
const fileMatches = {};

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'scratch' || file === '.git') continue;
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (file.endsWith('.js')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const jsFiles = walkSync(directoryPath);

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let inMultiLineComment = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle multi-line comments roughly
    if (inMultiLineComment) {
      if (line.includes('*/')) {
        inMultiLineComment = false;
        line = line.substring(line.indexOf('*/') + 2);
      } else {
        continue;
      }
    }
    if (line.includes('/*')) {
      inMultiLineComment = true;
      line = line.substring(0, line.indexOf('/*'));
    }
    
    // Ignore single line comments
    if (line.includes('//')) {
      line = line.substring(0, line.indexOf('//'));
    }

    // Find strings with Arabic characters
    // Using regex to find strings in ', ", or `
    // This is a simplistic regex but should work for this codebase
    const regex = /(['"`])(.*?[\u0600-\u06FF]+.*?)\1/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const matchedString = match[2];
      results.add(matchedString);
      if (!fileMatches[file]) fileMatches[file] = [];
      fileMatches[file].push({ line: i + 1, string: matchedString });
    }
  }
}

fs.writeFileSync('strings.json', JSON.stringify(Array.from(results), null, 2));
console.log(`Extracted ${results.size} unique Arabic strings.`);
