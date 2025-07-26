const socket = io();

const tableBody = document.getElementById("statusTableBody");
const modal = document.getElementById("modal");
const entryForm = document.getElementById("entryForm");
const addEntryBtn = document.getElementById("addEntryBtn");
const cancelBtn = document.getElementById("cancelBtn");

const inputName = document.getElementById("inputName");
const inputStatus = document.getElementById("inputStatus");
const inputVehicle = document.getElementById("inputVehicle");

const username = sessionStorage.getItem("username");
if (!username) {
  window.location.href = "/";
}

let editMode = false;

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("username");
  window.location.href = "/";
});

// Navigation zwischen Seiten
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

  btnStatus.classList.add("bg-blue-600");
  btnFahrzeug.classList.remove("bg-blue-600");
  btnEinwohner.classList.remove("bg-blue-600");
});
btnFahrzeug.addEventListener("click", () => {
  pageStatus.classList.add("hidden");
  pageFahrzeug.classList.remove("hidden");
  pageEinwohner.classList.add("hidden");

  btnStatus.classList.remove("bg-blue-600");
  btnFahrzeug.classList.add("bg-blue-600");
  btnEinwohner.classList.remove("bg-blue-600");
});
btnEinwohner.addEventListener("click", () => {
  pageStatus.classList.add("hidden");
  pageFahrzeug.classList.add("hidden");
  pageEinwohner.classList.remove("hidden");

  btnStatus.classList.remove("bg-blue-600");
  btnFahrzeug.classList.remove("bg-blue-600");
  btnEinwohner.classList.add("bg-blue-600");
});

// Status-Liste

let statusList = [];

addEntryBtn.addEventListener("click", () => {
  // Nur einen Eintrag pro Benutzer erlauben
  if (statusList.find((e) => e.name === username)) {
    alert("Du kannst nur einen Eintrag haben. Bitte bearbeite oder lösche deinen bestehenden.");
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

  const name = inputName.value;
  const status = inputStatus.value;
  const vehicle = inputVehicle.value;

  const entry = { name, status, vehicle };

  if (editMode) {
    socket.emit("editEntry", entry);
  } else {
    socket.emit("addEntry", entry);
  }

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
    const isMine = entry.name === username;

    const tr = document.createElement("tr");
    tr.className = "border-t border-gray-700";

    tr.innerHTML = `
      <td class="p-3">${entry.name}</td>
      <td class="p-3">${entry.vehicle}</td>
      <td class="p-3">${entry.status}</td>
      <td class="p-3 space-x-2">
        ${
          isMine
            ? `<button class="editBtn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded">Edit</button>
               <button class="deleteBtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Löschen</button>`
            : ""
        }
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener("click", (e) => {
  const row = e.target.closest("tr");
  if (!row) return;

  const name = row.children[0].textContent;
  const vehicle = row.children[1].textContent;
  const status = row.children[2].textContent;

  if (e.target.classList.contains("deleteBtn")) {
    if (name !== username) {
      alert("Du kannst nur deinen eigenen Eintrag löschen.");
      return;
    }
    socket.emit("deleteEntry", name);
  }

  if (e.target.classList.contains("editBtn")) {
    if (name !== username) {
      alert("Du kannst nur deinen eigenen Eintrag bearbeiten.");
      return;
    }
    editMode = true;
    inputName.value = name;
    inputName.disabled = true;
    inputStatus.value = status;
    inputVehicle.value = vehicle;
    modal.classList.remove("hidden");
  }
});

// Einwohner Suche

const searchInput = document.getElementById("searchInput");
const einwohnerList = document.getElementById("einwohnerList");

let einwohnerData = [];

async function loadEinwohner() {
  try {
    const res = await fetch("/api/einwohner");
    einwohnerData = await res.json();
    renderEinwohnerList(""); // Anfang: keine Einträge anzeigen
  } catch {
    einwohnerList.innerHTML = "<li>Fehler beim Laden der Daten</li>";
  }
}

function renderEinwohnerList(filter) {
  einwohnerList.innerHTML = "";

  if (filter.trim() === "") {
    einwohnerList.innerHTML = "<li class='text-gray-500 italic'>Bitte Suche eingeben und Enter drücken...</li>";
    return;
  }

  const filtered = einwohnerData.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    einwohnerList.innerHTML = "<li>Keine Einträge gefunden.</li>";
    return;
  }

  filtered.forEach(({ name, geburtsdatum }) => {
    const li = document.createElement("li");
    li.textContent = `${name} (${geburtsdatum})`;
    li.className = "border-b border-gray-700 py-2";
    einwohnerList.appendChild(li);
  });
}

// Jetzt Listener nur auf Enter

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    renderEinwohnerList(searchInput.value);
  }
});

// Seite initial laden
loadEinwohner();


