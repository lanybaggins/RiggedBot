export default (client) => {
  console.log(`${client.user.tag} is online with production set to ${client.config.isProduction}.`);
};
