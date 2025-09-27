// manufacturer.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("manufacturer-form");
  const privateKeyInput = document.getElementById("privateKey");
  const drugIdInput = document.getElementById("drugId");
  const drugNameInput = document.getElementById("drugName");
  const compositionInput = document.getElementById("composition");
  const dosageInput = document.getElementById("dosage");
  const batchNoInput = document.getElementById("batchNo");
  const expiryInput = document.getElementById("expiry");
  const statusBox = document.getElementById("status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const privateKey = privateKeyInput.value.trim();
    if (!privateKey) return alert("Please enter private key");

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const signer = account.address;

    const payload = {
      drugId: drugIdInput.value,
      drugName: drugNameInput.value,
      composition: compositionInput.value,
      dosage: dosageInput.value,
      batchNo: batchNoInput.value,
      expiryDate: expiryInput.value,
    };

    try {
      // Get nonce from blockchain
      const nonce = await fetch(`http://localhost:3000/api/nonce/${signer}`).then(r => r.json());

      const hash = web3.utils.soliditySha3(
        { t: "string", v: payload.drugId },
        { t: "string", v: payload.drugName },
        { t: "string", v: payload.composition },
        { t: "string", v: payload.dosage },
        { t: "string", v: payload.batchNo },
        { t: "string", v: payload.expiryDate },
        { t: "uint256", v: nonce.nonce }
      );

      const signature = web3.eth.accounts.sign(hash, privateKey).signature;

      const fullPayload = { ...payload, signer, signature };

      const res = await fetch("http://localhost:3000/api/registerWithSig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      const data = await res.json();
      if (data.ok) {
        statusBox.innerText = `✅ Drug ${payload.drugId} registered`;
        statusBox.style.color = "green";
      } else {
        statusBox.innerText = `❌ Error: ${data.error}`;
        statusBox.style.color = "red";
      }

    } catch (err) {
      console.error(err);
      statusBox.innerText = "❌ Signing or registration failed";
      statusBox.style.color = "red";
    }
  });
});
