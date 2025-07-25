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
  tableBody.innerHTML = "";

  entries.forEach(entry => {
    const isMine = entry.name === username;

    const tr = document.createElement("tr");
    tr.className = "border-t border-gray-700";

    tr.innerHTML = `
      <td class="p-3">${entry.name}</td>
      <td class="p-3">${entry.vehicle}</td>
      <td class="p-3">${entry.status}</td>
      <td class="p-3 space-x-2">
        ${isMine ? `
          <button class="editBtn bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded">Edit</button>
          <button class="deleteBtn bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Löschen</button>
        ` : ""}
      </td>
    `;

    tableBody.appendChild(tr);
  });
});

tableBody.addEventListener("click", (e) => {
  const row = e.target.closest("tr");
  const name = row.children[0].textContent;
  const vehicle = row.children[1].textContent;
  const status = row.children[2].textContent;

  if (e.target.classList.contains("deleteBtn")) {
    socket.emit("deleteEntry", name);
  }

  if (e.target.classList.contains("editBtn")) {
    editMode = true;
    inputName.value = name;
    inputName.disabled = true;
    inputStatus.value = status;
    inputVehicle.value = vehicle;
    modal.classList.remove("hidden");
  }
});

