import getAllFiles from '../utils/controller/getAllFiles.js';
import { fileURLToPath, pathToFileURL } from "url";
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (client) => {
  const eventFolders = getAllFiles(__dirname, true);
  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    eventFiles.sort((a, b) => a > b);
    const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();

    client.on(eventName, async (arg) => {
      for (const eventFile of eventFiles) {
        const fileName = eventFile.replace(/\\/g, '/').split('/').pop();
        const mod = await import(pathToFileURL(eventFile).href);
        const eventFunction = mod.default;
        await eventFunction(client, arg);
      }
    });
  }
};
