// signerDemo.js
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

// ✅ 1️⃣ Connect to Ganache
const web3 = new Web3("http://127.0.0.1:8545");

// ✅ 2️⃣ Manufacturer private key from Ganache (not MetaMask!)
const MANUFACTURER_PRIVATE_KEY = "0x6969cc75a8038e4026557c8ff0f2722d32bfbf421c134d16e04be7ec9b193f62"; // 👈 replace if needed
const manufacturer = web3.eth.accounts.privateKeyToAccount(MANUFACTURER_PRIVATE_KEY);
web3.eth.accounts.wallet.add(manufacturer);

// ✅ 3️⃣ Load the deployed contract ABI & address safely
const contractPath = path.join(__dirname, "build/contracts/DrugRegistry.json");
if (!fs.existsSync(contractPath)) {
  console.error("🚨 Contract JSON not found. Run `truffle migrate --reset` first.");
  process.exit(1);
}

const contractJSON = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const networkIds = Object.keys(contractJSON.networks);
if (networkIds.length === 0) {
  console.error("🚨 No networks found in DrugRegistry.json. Did you migrate?");
  process.exit(1);
}

const networkId = networkIds[networkIds.length - 1];
const contractAddress = contractJSON.networks[networkId].address;
const contract = new web3.eth.Contract(contractJSON.abi, contractAddress);

(async () => {
  try {
    // ✅ 4️⃣ Define drug details (can be made dynamic later)
    const drug = {
      drugId: "DRUG-" + Math.floor(Math.random() * 100000), // 👈 auto-generate unique ID
      drugName: "Amoxicillin",
      composition: "Amoxicillin",
      dosage: "250mg",
      batchNo: "B-002",
      expiryDate: "2027-01-01",
    };

    // ✅ 5️⃣ Fetch current nonce for manufacturer
    const nonce = await contract.methods.nonces(manufacturer.address).call();

    // ✅ 6️⃣ Hash exactly like the contract
    const hash = web3.utils.soliditySha3(
      { t: "string", v: drug.drugId },
      { t: "string", v: drug.drugName },
      { t: "string", v: drug.composition },
      { t: "string", v: drug.dosage },
      { t: "string", v: drug.batchNo },
      { t: "string", v: drug.expiryDate },
      { t: "uint256", v: nonce }
    );

    // ✅ 7️⃣ Sign the hash with manufacturer's private key
    const signature = web3.eth.accounts.sign(hash, MANUFACTURER_PRIVATE_KEY).signature;

    console.log("✅ Manufacturer Address:", manufacturer.address);
    console.log("Nonce:", nonce);
    console.log("Hash:", hash);
    console.log("Signature:", signature);
    console.log("Generated Drug ID:", drug.drugId);

    // 🧠 BONUS → Auto generate CURL
    const payload = {
      ...drug,
      signer: manufacturer.address,
      signature: signature,
    };

    console.log("\n🚀 Copy & run this curl command:");
    console.log("-----------------------------------------------------");
    console.log(`curl -X POST http://localhost:3000/api/registerWithSig \\`);
    console.log(`-H "Content-Type: application/json" \\`);
    console.log(`-d '${JSON.stringify(payload)}'`);
    console.log("-----------------------------------------------------");
  } catch (err) {
    console.error("❌ signerDemo error:", err);
  }
})();
