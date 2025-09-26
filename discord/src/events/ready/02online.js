import consoleLog from "../../utils/log/consoleLog.js";
export default (client) => {
  consoleLog(`${client.user.tag} is online with production set to ${client.config.isProduction}.`);
};
