const { globSync } = require("glob");
const { normalize, sep } = require("path");
const { moveSync, removeSync } = require("fs-extra");

const searchPath = "_site/src/**/index.html";

try {
  const files = globSync(searchPath);
  for (const file of files) {
    const dirName = file.split(sep).slice(0, -1).join(sep);
    if (normalize(dirName) === normalize("_site/src")) continue;

    const newFileName = `${dirName.split(sep).slice(-1)}.html`;
    const newPath = `_site/src/${newFileName}`;
    try {
      moveSync(file, newPath, { overwrite: true });

      try {
        removeSync(dirName);
      } catch (err) {
        return console.error(`Error removing directory ${dirName}:`, err);
      }

      console.log(`Successfully moved file ${file} to ${newPath}`);
    } catch (err) {
      return console.error(`Error moving file ${file}:`, err);
    }
  }
} catch (err) {
  return console.error("Error extracting page folders to their own file:", err);
}