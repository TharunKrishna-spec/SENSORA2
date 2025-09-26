const DrugRegistry = artifacts.require("DrugRegistry");

module.exports = function (deployer) {
  deployer.deploy(DrugRegistry);
};
