// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

// Load compiled contract JSON
const contractJSONPath = path.join(__dirname, "build/contracts/DrugRegistry.json");
if (!fs.existsSync(contractJSONPath)) {
  console.error("ERROR: build/contracts/DrugRegistry.json not found. Did you compile?");
  process.exit(1);
}
const contractJSON = JSON.parse(fs.readFileSync(contractJSONPath, "utf8"));

// Ensure a network entry exists
const networkKeys = Object.keys(contractJSON.networks || {});
if (networkKeys.length === 0) {
  console.error("ERROR: No deployed networks found in ABI. Did you run `truffle migrate`?");
  process.exit(1);
}
// pick the last deployed network entry (safe choice)
const networkId = networkKeys[networkKeys.length - 1];
const contractAddress = contractJSON.networks[networkId].address;
const contract = new web3.eth.Contract(contractJSON.abi, contractAddress);

let defaultAccount;
async function init() {
  const accounts = await web3.eth.getAccounts();
  defaultAccount = accounts[0];
  console.log("✅ Using account:", defaultAccount);
  console.log("✅ Contract address:", contractAddress);
}
init();

// Register route (kept for completeness)
app.post("/api/register", async (req, res) => {
  try {
    const { drugId, drugName, composition, dosage, batchNo, expiryDate } = req.body;
    if (!drugId || !drugName) return res.status(400).json({ ok: false, error: "missing fields" });

    await contract.methods
      .registerBatch(drugId, drugName, composition, dosage, batchNo, expiryDate)
      .send({ from: defaultAccount, gas: 500000 });

    res.json({ ok: true, msg: `Drug ${drugId} registered` });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/updateLocation", async (req, res) => {
  try {
    const { drugId, location, timestamp } = req.body;
    if (!drugId || !location) return res.status(400).json({ ok: false, error: "missing fields" });

    await contract.methods
      .updateLocation(drugId, location, timestamp)
      .send({ from: defaultAccount, gas: 500000 });

    res.json({ ok: true, msg: `Drug ${drugId} location updated` });
  } catch (err) {
    console.error("updateLocation error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======= IMPORTANT: Updated verify route to handle 3 arrays returned from getHistory =======
app.get("/api/verify/:drugId", async (req, res) => {
  try {
    const drugId = req.params.drugId;

    // getDetails returns (drugName, composition, dosage, batchNo, expiryDate)
    const details = await contract.methods.getDetails(drugId).call();

    // getHistory now returns (locations[], timestamps[], actors[])
    const historyArrays = await contract.methods.getHistory(drugId).call();
    // web3 may return an object-like or array-like; destructure defensively
    // historyArrays[0] = locations, [1] = timestamps, [2] = actors
    const locations = historyArrays[0] || [];
    const timestamps = historyArrays[1] || [];
    const actors = historyArrays[2] || [];

    // build history array of objects
    const history = [];
    for (let i = 0; i < locations.length; i++) {
      history.push({
        location: locations[i],
        timestamp: timestamps[i],
        actor: actors[i]
      });
    }

    res.json({
      ok: true,
      drugId,
      drugName: details[0],
      composition: details[1],
      dosage: details[2],
      batchNo: details[3],
      expiry: details[4],
      history
    });
  } catch (err) {
    console.error("verify error:", err.toString ? err.toString() : err);
    // If contract threw "Drug not found" require, return ok:false with message
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
});
