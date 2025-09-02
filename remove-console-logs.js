#!/usr/bin/env node

/**
 * Script to remove all console.log statements from the codebase
 */

const fs = require('fs');
const path = require('path');

// File extensions to process
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build'];

// Console methods to remove
const CONSOLE_METHODS = [
  'console.log',
  'console.info',
  'console.warn',
  'console.error',
  'console.debug',
  'console.trace'
];

let totalFilesProcessed = 0;
let totalLinesRemoved = 0;

function shouldProcessFile(filePath) {
  // Check if file has valid extension
  const ext = path.extname(filePath);
  if (!EXTENSIONS.includes(ext)) return false;

  // Check if file is in excluded directory
  const relativePath = path.relative(process.cwd(), filePath);
  for (const excludeDir of EXCLUDE_DIRS) {
    if (relativePath.includes(excludeDir)) return false;
  }

  return true;
}

function removeConsoleLogs(content) {
  const lines = content.split('\n');
  const filteredLines = [];
  let removedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Only remove lines that are EXACTLY console method calls
    let shouldRemove = false;
    for (const method of CONSOLE_METHODS) {
      // More precise regex that matches complete console statements
      const patterns = [
        // Standard console.log('message');
        new RegExp(`^\\s*${method.replace('.', '\\.')}\\s*\\([^)]*\\)\\s*;?\\s*$`),
        // Multi-line console.log with template literals
        new RegExp(`^\\s*${method.replace('.', '\\.')}\\s*\\(\`[^)]*$`),
        // Console with object logging
        new RegExp(`^\\s*${method.replace('.', '\\.')}\\s*\\([^)]*\\{[^}]*\\}[^)]*\\)\\s*;?\\s*$`)
      ];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          shouldRemove = true;
          break;
        }
      }

      if (shouldRemove) break;
    }

    if (shouldRemove) {
      removedCount++;
      // Skip this line (don't add to filteredLines)
      continue;
    }

    filteredLines.push(line);
  }

  return {
    content: filteredLines.join('\n'),
    removedCount
  };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = removeConsoleLogs(content);

    if (result.removedCount > 0) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      totalLinesRemoved += result.removedCount;
    }

    totalFilesProcessed++;
  } catch (error) {
  }
}

function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_DIRS.includes(item)) {
          processDirectory(itemPath);
        }
      } else if (stat.isFile() && shouldProcessFile(itemPath)) {
        processFile(itemPath);
      }
    }
  } catch (error) {
  }
}

function main() {

  const startTime = Date.now();

  // Process current directory
  processDirectory(process.cwd());

  const endTime = Date.now();
  const duration = endTime - startTime;


  if (totalLinesRemoved > 0) {
  } else {
  }
}

// Run the script
main();
