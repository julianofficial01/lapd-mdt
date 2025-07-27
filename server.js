const express = require("express");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Login API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  try {
    const users = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/users.json"), "utf-8")
    );

    const validUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (validUser) {
      res.status(200).json({ message: "Erfolgreich eingeloggt" });
    } else {
      res.status(401).json({ error: "Falsche Zugangsdaten" });
    }
  } catch {
    res.status(500).json({ error: "Serverfehler" });
  }
});

// API für Einwohner Suche
app.get("/api/einwohner", (req, res) => {
  try {
    const einwohner = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/datenbank.json"), "utf-8")
    );
    res.json(einwohner);
  } catch {
    res.status(500).json({ error: "Fehler beim Laden der Daten" });
  }
});

// Status Liste WebSocket Logik
let statusList = [];

io.on("connection", (socket) => {
  socket.emit("updateList", statusList);

  socket.on("addEntry", (entry) => {
    // Nur ein Eintrag pro Nutzer
    statusList = statusList.filter((e) => e.name !== entry.name);
    statusList.push(entry);
    io.emit("updateList", statusList);
  });

  socket.on("deleteEntry", (name) => {
    statusList = statusList.filter((e) => e.name !== name);
    io.emit("updateList", statusList);
  });

  socket.on("editEntry", (entry) => {
    statusList = statusList.map((e) => (e.name === entry.name ? entry : e));
    io.emit("updateList", statusList);
  });
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});


