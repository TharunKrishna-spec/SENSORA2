const addressInput = document.getElementById("manufacturerAddress");
const nameInput = document.getElementById("manufacturerName");
const statusDiv = document.getElementById("status");
const listEl = document.getElementById("manufacturerList");

document.getElementById("authorizeBtn").onclick = async () => {
  const address = addressInput.value.trim();
  const name = nameInput.value.trim();
  if (!address) return alert("Enter address");

  try {
    // Call backend
    const resp = await fetch("http://localhost:3000/api/authorizeManufacturer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error);

    await db.collection("manufacturers").doc(address).set({
      name,
      status: "authorized",
      createdAt: new Date(),
    });

    statusDiv.innerText = `✅ Authorized ${address}`;
  } catch (err) {
    statusDiv.innerText = `❌ ${err.message}`;
  }
};

document.getElementById("revokeBtn").onclick = async () => {
  const address = addressInput.value.trim();
  if (!address) return alert("Enter address");

  try {
    const resp = await fetch("http://localhost:3000/api/revokeManufacturer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error);

    await db.collection("manufacturers").doc(address).update({
      status: "revoked",
    });

    statusDiv.innerText = `🚫 Revoked ${address}`;
  } catch (err) {
    statusDiv.innerText = `❌ ${err.message}`;
  }
};

// Live list
db.collection("manufacturers").onSnapshot(snapshot => {
  listEl.innerHTML = "";
  snapshot.forEach(doc => {
    const d = doc.data();
    const li = document.createElement("li");
    li.innerText = `${doc.id} — ${d.name || "N/A"} (${d.status})`;
    listEl.appendChild(li);
  });
});
