import path from 'path';
import fs from 'fs';

export function searchDirectory(rootDir, searchTerm) {
  const results = [];

  function dfs(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        // Recursive call for directories
        dfs(fullPath);
      } else if (stats.isFile()) {
        // Check if the file contains the search term
        if (
          file?.toLocaleLowerCase().includes(searchTerm?.toLocaleLowerCase())
        ) {
          results.push(fullPath);
        }
      }
    }
  }

  // Start DFS from the root directory
  dfs(rootDir);

  return results;
}
