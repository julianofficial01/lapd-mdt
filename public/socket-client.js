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
let editMode = false;

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("username");
  window.location.href = "/";
});

addEntryBtn.addEventListener("click", () => {
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

  if (editMode) socket.emit("editEntry", entry);
  else socket.emit("addEntry", entry);

  modal.classList.add("hidden");
  entryForm.reset();
});

socket.on("updateList", (entries) => {
  tableBody.innerHTML = "";
  entries.forEach((entry) => {
    const isMine = entry.name === username;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.name}</td>
      <td>${entry.vehicle}</td>
      <td>${entry.status}</td>
      <td>
        ${
          isMine
            ? `
        <button class="editBtn bg-yellow-500 px-2 rounded">Edit</button>
        <button class="deleteBtn bg-red-600 px-2 rounded">Löschen</button>`
            : ""
        }
      </td>
    `;
    if (isMine) {
      tr.querySelector(".editBtn").addEventListener("click", () => {
        editMode = true;
        inputName.value = entry.name;
        inputVehicle.value = entry.vehicle;
        inputStatus.value = entry.status;
        modal.classList.remove("hidden");
      });
      tr.querySelector(".deleteBtn").addEventListener("click", () => {
        socket.emit("deleteEntry", entry.name);
      });
    }
    tableBody.appendChild(tr);
  });
});

// Einwohner Suche
const einwohnerList = document.getElementById("einwohnerList");
const searchInput = document.getElementById("einwohnerSearch");
let alleEinwohner = [];

if (einwohnerList && searchInput) {
  async function ladeEinwohner() {
    const res = await fetch("/api/einwohner");
    alleEinwohner = await res.json();
    filterEinwohner("");
  }

  function filterEinwohner(query) {
    const gefiltert = alleEinwohner.filter((e) =>
      e.name.toLowerCase().includes(query.toLowerCase())
    );
    einwohnerList.innerHTML = "";
    gefiltert.forEach((e) => {
      const li = document.createElement("li");
      li.textContent = `${e.name} (${e.geburtsdatum})`;
      li.className =
        "border-b border-gray-700 py-2 cursor-pointer hover:bg-gray-700";
      li.addEventListener("click", () => {
        öffneAkte(e.name);
      });
      einwohnerList.appendChild(li);
    });
  }

  searchInput.addEventListener("input", (e) => filterEinwohner(e.target.value));
  ladeEinwohner();
}

// === Akten Modal & Tabs ===
const akteModal = document.getElementById("akteModal");
const closeAkteBtn = document.getElementById("closeAkteBtn");
const tabButtons = document.querySelectorAll(".akte-tab-button");
const tabContents = document.querySelectorAll(".akte-tab-content");

// Personeninfo Felder
const personVorname = document.getElementById("personVorname");
const personNachname = document.getElementById("personNachname");
const personGeburtsdatum = document.getElementById("personGeburtsdatum");
const personGroesse = document.getElementById("personGroesse");

// Notizen
const notizenContainer = document.getElementById("notizenContainer");
const addNoteBtn = document.getElementById("addNoteBtn");
const noteModal = document.getElementById("noteModal");
const noteForm = document.getElementById("noteForm");
const noteText = document.getElementById("noteText");
const noteColor = document.getElementById("noteColor");
const noteCancelBtn = document.getElementById("noteCancelBtn");
const noteSubmitBtn = document.getElementById("noteSubmitBtn");

let aktuellerEinwohner = null;

closeAkteBtn.addEventListener("click", () => {
  akteModal.classList.add("hidden");
  aktuellerEinwohner = null;
});

// Tabs wechseln
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("border-b-2", "border-blue-500"));
    btn.classList.add("border-b-2", "border-blue-500");

    const target = btn.getAttribute("data-tab");
    tabContents.forEach((content) => {
      content.classList.add("hidden");
    });
    document.getElementById(target).classList.remove("hidden");
  });
});

function öffneAkte(name) {
  aktuellerEinwohner = alleEinwohner.find((e) => e.name === name);
  if (!aktuellerEinwohner) return;

  // Personeninfo füllen
  personVorname.textContent = aktuellerEinwohner.vorname || "-";
  personNachname.textContent = aktuellerEinwohner.nachname || "-";
  personGeburtsdatum.textContent = aktuellerEinwohner.geburtsdatum || "-";
  personGroesse.textContent = aktuellerEinwohner.größe || "-";

  // Notizen laden
  socket.emit("requestNotes", aktuellerEinwohner.name);

  akteModal.classList.remove("hidden");
  // Default Tab auf Personeninformationen setzen
  tabButtons.forEach((b) => b.classList.remove("border-b-2", "border-blue-500"));
  tabContents.forEach((c) => c.classList.add("hidden"));
  document.querySelector('.akte-tab-button[data-tab="personeninfo"]').classList.add("border-b-2", "border-blue-500");
  document.getElementById("personeninfo").classList.remove("hidden");
}

// Notizen aktualisieren wenn Server sendet
socket.on("updateNotes", ({ name, notizen }) => {
  if (!aktuellerEinwohner || aktuellerEinwohner.name !== name) return;

  notizenContainer.innerHTML = "";

  if (notizen.length === 0) {
    notizenContainer.textContent = "Keine Notizen vorhanden.";
    return;
  }

  // Notizen anzeigen: nebeneinander, umbrechen wenn zu breit
  const notizWrapper = document.createElement("div");
  notizWrapper.className = "flex flex-wrap gap-2";

  notizen.forEach((note) => {
    const div = document.createElement("div");
    div.className = `p-2 rounded text-white max-w-xs break-words relative`;
    div.style.backgroundColor = mapColor(note.farbe);
    div.innerHTML = `<strong>${note.officer}</strong><br>${note.message}`;
    notizWrapper.appendChild(div);
  });

  notizenContainer.appendChild(notizWrapper);
});

function mapColor(farbe) {
  switch (farbe) {
    case "geld":
    case "grün":
      return "#22c55e"; // grün
    case "orange":
      return "#f97316"; // orange
    case "rot":
      return "#ef4444"; // rot
    case "blau":
      return "#3b82f6"; // blau
    default:
      return "#6b7280"; // grau fallback
  }
}

// Notiz Modal öffnen
addNoteBtn.addEventListener("click", () => {
  noteText.value = "";
  noteColor.value = "geld";
  noteModal.classList.remove("hidden");
});

// Notiz Modal schließen
noteCancelBtn.addEventListener("click", () => {
  noteModal.classList.add("hidden");
});

// Notiz absenden
noteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!aktuellerEinwohner) return;

  const neueNotiz = {
    officer: username || "Unbekannt",
    message: noteText.value.trim(),
    farbe: noteColor.value,
  };

  if (!neueNotiz.message) return;

  socket.emit("addNote", { name: aktuellerEinwohner.name, note: neueNotiz });

  noteModal.classList.add("hidden");
});
