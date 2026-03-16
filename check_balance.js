import fs from 'fs';
const content = fs.readFileSync('d:/GitHub Project/SlideMaker/src/pages/Editor.tsx', 'utf8');

function checkBalance(str) {
  let curly = 0;
  let square = 0;
  let paren = 0;
  let inString = null;
  let inJSXExpr = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inString) {
      if (char === inString && str[i-1] !== '\\') inString = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }
    
    // Very basic comment skipping
    if (char === '/' && str[i+1] === '/') {
      while (str[i] !== '\n' && i < str.length) i++;
      continue;
    }
    
    if (char === '{') curly++;
    if (char === '}') curly--;
    if (char === '[') square++;
    if (char === ']') square--;
    if (char === '(') paren++;
    if (char === ')') paren--;
    
    if (curly < 0 || square < 0 || paren < 0) {
      console.log(`Unbalanced at index ${i} (line ${str.substring(0, i).split('\n').length}): char ${char}, {:${curly}, [:${square}, (:${paren}`);
      return false;
    }
  }
  console.log(`Final balance: {:${curly}, [:${square}, (:${paren}`);
  return curly === 0 && square === 0 && paren === 0;
}

checkBalance(content);
