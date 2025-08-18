import { readdirSync, existsSync } from "fs";
import path from "path";

export default (directory, foldersOnly = false) => {
  if (!existsSync(directory)) return [];
  if (foldersOnly === true) {
    const files = readdirSync(directory, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => path.join(directory, dir.name));
    return files
  } else {
    const files = readdirSync(directory, { withFileTypes: true })
      //.filter(file => file.isFile())
      .map(file => path.join(directory, file.name));
    return files
  }
};
