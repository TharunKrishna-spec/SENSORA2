
const express = require("express");
const bodyParser = require("body-parser");
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

const app = express();
const cors = require("cors");
app.use(cors());

app.use(bodyParser.json());

// 1. Connect to Ganache blockchain
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

// 2. Load compiled contract ABI + address
const contractJSON = JSON.parse(
  fs.readFileSync(path.join(__dirname, "build/contracts/DrugRegistry.json"))
);

// get deployed network id (Ganache creates a random one each run)
//mychange

const networkId = Object.keys(contractJSON.networks)[0];
const contractAddress = contractJSON.networks[networkId].address;
//const contractAddress = "0xYourNewContractAddressHere";
const contract = new web3.eth.Contract(contractJSON.abi, contractAddress);

let defaultAccount;

// 3. Get accounts
async function init() {
  const accounts = await web3.eth.getAccounts();
  defaultAccount = accounts[0];
  console.log("✅ Using account:", defaultAccount);
  console.log("✅ Contract address:", contractAddress);
}
init();

// ---------------------- API ROUTES ---------------------- //

// Manufacturer registers new drug
app.post("/api/register", async (req, res) => {
  try {
    const { drugId, batchNo, expiryDate } = req.body;
    await contract.methods
      .registerBatch(drugId, batchNo, expiryDate)
      .send({ from: defaultAccount, gas: 300000 });
    res.json({ ok: true, msg: `Drug ${drugId} registered` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Update location (from ESP32 or distributor scan)
app.post("/api/updateLocation", async (req, res) => {
  try {
    const { drugId, location, timestamp } = req.body;
    await contract.methods
      .updateLocation(drugId, location, timestamp)
      .send({ from: defaultAccount, gas: 300000 });
    res.json({ ok: true, msg: `Drug ${drugId} location updated` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Verify drug (consumer side)
app.get("/api/verify/:drugId", async (req, res) => {
  try {
    const drugId = req.params.drugId;
    const expiry = await contract.methods.getExpiry(drugId).call();
    const history = await contract.methods.getHistory(drugId).call();
    res.json({ ok: true, drugId, expiry, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------- Start Server ---------------------- //
app.listen(3000, () => {
  console.log("🚀 Backend API running on http://localhost:3000");
});
