document.getElementById("verifyBtn").onclick = async () => {
  const id = document.getElementById("verifyId").value.trim();
  if (!id) return alert("Enter Drug ID");

  const res = await fetch(`http://localhost:3000/api/verify/${id}`).then(r => r.json());
  const output = document.getElementById("verifyOutput");
  const table = document.getElementById("historyTable");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  if (!res.ok) {
    output.innerText = `❌ ${res.error}`;
    table.style.display = "none";
    return;
  }

  output.innerText = `Drug: ${res.drugName}\nComposition: ${res.composition}\nDosage: ${res.dosage}\nExpiry: ${res.expiry}`;

  if (res.history.length > 0) {
    res.history.forEach(h => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${h.location}</td><td>${h.timestamp}</td><td>${h.actor}</td>`;
      tbody.appendChild(tr);
    });
    table.style.display = "table";
  } else {
    table.style.display = "none";
  }
};
