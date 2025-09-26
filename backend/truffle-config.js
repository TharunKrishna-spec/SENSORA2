module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Ganache runs on localhost
      port: 8545,            // default Ganache port
      network_id: "*",       // Match any network id
    },
  },

  compilers: {
    solc: {
      version: "0.8.20",     // Solidity version
    },
  },
};
