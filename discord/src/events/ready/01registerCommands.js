import areCommandsDifferent from "../../utils/controller/areCommandsDifferent.js";
import getApplicationCommands from "../../utils/controller/getApplicationCommands.js";
import getLocalCommands from "../../utils/controller/getLocalCommands.js";
import consoleLog from "../../utils/log/consoleLog.js";

export default async (client) => {
  try {
    const localCommands = await getLocalCommands();
    const applicationCommands = await getApplicationCommands(
      client
    );

    for (const localCommand of localCommands) {
      const { name, description, options } = localCommand;

      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === name
      );
      const deleteCommand = localCommand.deleted || (client.config.isProduction && (localCommand.devEnvironmentOnly || localCommand.developersOnly))
      if (existingCommand) {
        if (deleteCommand) {
          consoleLog(`🗑 Deleting command "${name}".`);
          await applicationCommands.delete(existingCommand.id);
          continue;
        }

        if (areCommandsDifferent(existingCommand, localCommand)) {
          consoleLog(`🔁 Editing command "${name}".`);
          await applicationCommands.edit(existingCommand.id, {
            description,
            options,
          });
          continue;
        }
        consoleLog(`✅ Command "${name}" is already registered and up to date.`);
      } else {
        if (deleteCommand) {
          consoleLog(
            `⏩ Skipping registering command "${name}" as it's set to delete or not application for this environment.`
          );
          continue;
        }

        consoleLog(`👍 Registering command "${name}."`);
        await applicationCommands.create({
          name,
          description,
          options,
        });
      }
    }
  } catch (error) {
    console.error(`There was an error`, error);
  }
};
