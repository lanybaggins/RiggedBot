import areCommandsDifferent from "../../utils/controller/areCommandsDifferent.js";
import getApplicationCommands from "../../utils/controller/getApplicationCommands.js";
import getLocalCommands from "../../utils/controller/getLocalCommands.js";

export default async (client) => {
  try {
    const localCommands = await getLocalCommands();
    const applicationCommands = await getApplicationCommands(
      client
    );

    for (const localCommand of localCommands) {
      const { name, description, options } = localCommand;
      //console.log(`🔍 Reviewing command "${localCommand.name}".`);

      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === name
      );
      const deleteCommand = localCommand.deleted || (client.config.isProduction && (localCommand.devEnvironmentOnly || localCommand.developersOnly))
      //console.log(`isProduction: ${client.config.isProduction}; localCommand.devEnvironmentOnly: ${localCommand.devEnvironmentOnly}; localCommand.developersOnly: ${localCommand.developersOnly}; deleteCommand: ${deleteCommand}`);
      if (existingCommand) {
        if (deleteCommand) {
          console.log(`🗑 Deleting command "${name}".`);
          await applicationCommands.delete(existingCommand.id);
          continue;
        }

        if (areCommandsDifferent(existingCommand, localCommand)) {
          console.log(`🔁 Editing command "${name}".`);
          await applicationCommands.edit(existingCommand.id, {
            description,
            options,
          });
          continue;
        }
        console.log(`✅ Command "${name}" is already registered and up to date.`);
      } else {
        if (deleteCommand) {
          console.log(
            `⏩ Skipping registering command "${name}" as it's set to delete or not application for this environment.`
          );
          continue;
        }

        console.log(`👍 Registering command "${name}."`);
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
