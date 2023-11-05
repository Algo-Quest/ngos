import fs from 'fs';
import path from 'path';

// Function to calculate folder size recursively
export function getFolderSize(folderPath) {
  let totalSize = 0;

  function calculateSize(filePath) {
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath);
      files.forEach((file) => {
        calculateSize(path.join(filePath, file));
      });
    }
  }

  calculateSize(folderPath);

  // Convert bytes to kilobytes
  const sizeInKB = totalSize / 1024;

  return {
    sizeInBytes: totalSize,
    sizeInKB: sizeInKB.toFixed(2), // Fixed to two decimal places
  };
}
