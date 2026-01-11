export default (client, host) => {
    return client.config.devs.includes(host.id) && client.config.isProduction === false;
}
