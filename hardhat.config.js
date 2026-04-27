require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const networks = {
  localhost: {
    url: "http://127.0.0.1:8545",
  },
};

// ✅ Only add amoy network if values exist
if (AMOY_RPC_URL && PRIVATE_KEY) {
  networks.amoy = {
    url: AMOY_RPC_URL,
    accounts: [PRIVATE_KEY],
  };
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks,
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
  },
};
