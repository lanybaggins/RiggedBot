import getAllFiles from './getAllFiles.js';
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (exceptions = []) => {
  const localCommands = [];
  const featuresPath = path.join(__dirname, "..", "..", "features");

  // Loop through each feature folder
  const featureDirs = getAllFiles(featuresPath, true);
  for (const feature of featureDirs) {
    // Get files in commands
    const commandsPath = path.join(feature, "commands");
    const files = getAllFiles(commandsPath);
    // read each to get the name
    for (const file of files) {
      const mod = await import(pathToFileURL(file).href);
      const commandObject = mod.command;
      if (exceptions.includes(commandObject.name)) {
        continue;
      }
      localCommands.push(commandObject);
    }
  }

  return localCommands;
};
