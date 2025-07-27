const socket = io();

// STATUS-ÜBERSICHT
const tableBody = document.getElementById("statusTableBody");
const modal = document.getElementById("modal");
const entryForm = document.getElementById("entryForm");
const addEntryBtn = document.getElementById("addEntryBtn");
const cancelBtn = document.getElementById("cancelBtn");
const inputName = document.getElementById("inputName");
const inputStatus = document.getElementById("inputStatus");
const inputVehicle = document.getElementById("inputVehicle");

const username = sessionStorage.getItem("username");
if (!username) window.location.href = "/";

let editMode = false;

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("username");
  window.location.href = "/";
});

// Seiten-Navigation
const btnStatus = document.getElementById("btn-status");
const btnFahrzeug = document.getElementById("btn-fahrzeug");
const btnEinwohner = document.getElementById("btn-einwohner");
const pageStatus = document.getElementById("page-status");
const pageFahrzeug = document.getElementById("page-fahrzeug");
const pageEinwohner = document.getElementById("page-einwohner");

btnStatus.addEventListener("click", () => {
  pageStatus.classList.remove("hidden");
  pageFahrzeug.classList.add("hidden");
  pageEinwohner.classList.add("hidden");
  toggleActiveButton(btnStatus);
});
btnFahrzeug.addEventListener("click", () => {
  pageStatus.classList.add("hidden");
  pageFahrzeug.classList.remove("hidden");
  pageEinwohner.classList.add("hidden");
  toggleActiveButton(btnFahrzeug);
});
btnEinwohner.addEventListener("click", () => {
  pageStatus.classList.add("hidden");
  pageFahrzeug.classList.add("hidden");
  pageEinwohner.classList.remove("hidden");
  toggleActiveButton(btnEinwohner);
});

function toggleActiveButton(activeBtn) {
  [btnStatus, btnFahrzeug, btnEinwohner].forEach((btn) => {
    btn.classList.remove("bg-blue-600");
  });
  activeBtn.classList.add("bg-blue-600");
}

let statusList = [];

addEntryBtn.addEventListener("click", () => {
  if (statusList.find((e) => e.name === username)) {
    alert("Du hast bereits einen Eintrag.");
    return;
  }
  editMode = false;
  inputName.value = username;
  inputName.disabled = true;
  inputStatus.value = "";
  inputVehicle.value = "";
  modal.classList.remove("hidden");
});

cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  entryForm.reset();
});

entryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const entry = {
    name: inputName.value,
    status: inputStatus.value,
    vehicle: inputVehicle.value,
  };
  socket.emit(editMode ? "editEntry" : "addEntry", entry);
  modal.classList.add("hidden");
  entryForm.reset();
});

socket.on("updateList", (entries) => {
  statusList = entries;
  renderStatusTable();
});

function renderStatusTable() {
  tableBody.innerHTML = "";
  statusList.forEach((entry) => {
    const tr = document.createElement("tr");
    tr.className = "border-t border-gray-700";
    tr.innerHTML = `
      <td class="p-3">${entry.name}</td>
      <td class="p-3">${entry.vehicle}</td>
      <td class="p-3">${entry.status}</td>
      <td class="p-3 space-x-2">
        ${
          entry.name === username
            ? `<button class="editBtn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded">Edit</button>
               <button class="deleteBtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Löschen</button>`
            : ""
        }
      </td>`;
    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener("click", (e) => {
  const row = e.target.closest("tr");
  if (!row) return;
  const [nameCell, vehicleCell, statusCell] = row.children;
  const name = nameCell.textContent;
  if (e.target.classList.contains("deleteBtn")) {
    if (name !== username) return alert("Nur eigene Einträge löschen!");
    socket.emit("deleteEntry", name);
  }
  if (e.target.classList.contains("editBtn")) {
    if (name !== username) return alert("Nur eigene Einträge bearbeiten!");
    editMode = true;
    inputName.value = name;
    inputName.disabled = true;
    inputVehicle.value = vehicleCell.textContent;
    inputStatus.value = statusCell.textContent;
    modal.classList.remove("hidden");
  }
});

// EINWOHNER
const searchInput = document.getElementById("searchInput");
const einwohnerList = document.getElementById("einwohnerList");
const einwohnerModal = document.getElementById("einwohnerModal");
const closeEinwohnerModal = document.getElementById("closeEinwohnerModal");

const vornameText = document.getElementById("vornameText");
const nachnameText = document.getElementById("nachnameText");
const gebText = document.getElementById("gebText");
const groesseText = document.getElementById("groesseText");

const pkwText = document.getElementById("pkwFuehrerschein");
const waffenText = document.getElementById("waffenschein");
const lkwText = document.getElementById("lkwFuehrerschein");

const telefonText = document.getElementById("telefonText");
const emailText = document.getElementById("emailText");

let einwohnerData = [];

async function loadEinwohner() {
  try {
    const res = await fetch("/api/einwohner");
    einwohnerData = await res.json();
    renderEinwohnerList("");
  } catch {
    einwohnerList.innerHTML = "<li class='text-red-500'>Fehler beim Laden der Daten</li>";
  }
}

function renderEinwohnerList(filter) {
  einwohnerList.innerHTML = "";
  if (filter.trim() === "") {
    einwohnerList.innerHTML = "<li class='text-gray-500 italic'>Bitte Suchbegriff eingeben...</li>";
    return;
  }

  const filtered = einwohnerData.filter((p) =>
    `${p.vorname} ${p.nachname}`.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    einwohnerList.innerHTML = "<li>Keine Einträge gefunden.</li>";
    return;
  }

  filtered.forEach((person) => {
    const li = document.createElement("li");
    li.textContent = `${person.vorname} ${person.nachname}`;
    li.className = "p-2 bg-gray-600 hover:bg-gray-500 cursor-pointer rounded mb-2";
    li.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/einwohner");
        const latest = await res.json();
        const found = latest.find(
          (p) =>
            p.vorname === person.vorname && p.nachname === person.nachname
        );
        if (found) showEinwohnerModal(found);
      } catch {
        alert("Fehler beim Neuladen der Einwohnerdaten.");
      }
    });
    einwohnerList.appendChild(li);
  });
}

function showEinwohnerModal(person) {
  vornameText.textContent = person.vorname;
  nachnameText.textContent = person.nachname;
  gebText.textContent = person.geburtsdatum;
  groesseText.textContent = person.groesse;

  pkwText.style.display = person.pkwFuehrerschein === "ja" ? "block" : "none";
  waffenText.style.display = person.waffenschein === "ja" ? "block" : "none";
  lkwText.style.display = person.lkwFuehrerschein === "ja" ? "block" : "none";

  telefonText.textContent = person.telefonnummer || "-";
  emailText.textContent = person.email || "-";

  einwohnerModal.classList.remove("hidden");
}

closeEinwohnerModal.addEventListener("click", () => {
  einwohnerModal.classList.add("hidden");
});

searchInput.addEventListener("input", () => {
  renderEinwohnerList(searchInput.value);
});

// Initial laden
loadEinwohner();
