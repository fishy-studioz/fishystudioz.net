const fs = require("fs-extra");
const { globSync } = require("glob");
const path = require("path");

const searchPath = "_site/src/**/index.html";

try {
  const files = globSync(searchPath);
  for (const file of files) {
    const dirName = file.split(path.sep).slice(0, -1).join(path.sep);
    if (path.normalize(dirName) === path.normalize("_site/src")) continue;

    const newFileName = `${dirName.split(path.sep).slice(-1)}.html`;
    const newPath = `_site/src/${newFileName}`;
    fs.move(file, newPath, { overwrite: true }, err => {
      if (err)
        return console.error(`Error moving file ${file}:`, err);

      fs.remove(dirName, err => {
        if (err)
          return console.error(`Error removing directory ${dirName}:`, err);
        console.log(`Successfully moved file ${file} to ${newPath}`);
      });
    });
  }
} catch(err) {
  return console.error(err);
}