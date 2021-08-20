const CryptoSuits = artifacts.require("CryptoSuits");

module.exports = function (deployer) {
  deployer.deploy(CryptoSuits);
};