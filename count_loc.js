#!/usr/bin/env node
/**
 * Operation: SLOC Heist
 *
 * This script navigates the labyrinth of your Next.js project to count only the lines
 * that you— the mastermind—wrote. We exclude the default boilerplate areas such as
 * node_modules, .next, public, and any directories holding prepackaged UI components like shadcn.
 *
 * Use this tool to measure the real muscle behind your codebase.
 */

const fs = require('fs');
const path = require('path');

// The areas we consider off-limits—boilerplate zones we won't touch.
const ignoreDirs = ['node_modules', '.next', 'public'];

// The file extensions that represent our developer code. Extend as needed.
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

/**
 * Determines if a file or directory should be ignored based on its path.
 * @param {string} filePath - The full path of the file or directory.
 * @returns {boolean} - True if the path should be ignored.
 */
function isIgnored(filePath) {
  // Check if any ignored folder appears in the filePath.
  return ignoreDirs.some(ignored =>
    filePath.split(path.sep).includes(ignored)
  );
}

/**
 * Counts the non-empty lines in a file.
 * @param {string} filePath - The path to the file.
 * @returns {number} - The number of non-blank lines.
 */
function countLinesInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Consider a line if it contains non-whitespace characters.
  return content.split('\n').filter(line => line.trim() !== '').length;
}

/**
 * Recursively traverses a directory, counting SLOC in eligible files.
 * @param {string} dir - The directory path to traverse.
 * @returns {number} - The total SLOC in this directory.
 */
function traverseDir(dir) {
  let totalLines = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip directories that fall in our ignore list.
      if (isIgnored(fullPath)) continue;
      totalLines += traverseDir(fullPath);
    } else {
      // Only process files with valid extensions and not in an ignored path.
      if (fileExtensions.includes(path.extname(file)) && !isIgnored(fullPath)) {
        totalLines += countLinesInFile(fullPath);
      }
    }
  }
  return totalLines;
}

// Use the provided directory from CLI or default to the current working directory.
const projectDir = process.argv[2] || process.cwd();
const totalSLOC = traverseDir(projectDir);

console.log(`Total SLOC (developer-written code only): ${totalSLOC}`);
