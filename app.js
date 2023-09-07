const express = require("express");
const app = express();
const http = require("http").createServer(app);

const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

const cors = require("cors");

app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS,GET,POST,PUT,PATCH,DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Configuration de l'application Express
app.use(express.static("public"));

// Gestionnaire de connexion Socket.IO
io.on("connection", (socket) => {
  console.log("Un utilisateur est connecté");

  // Gestion des événements de chat
  socket.on("chat message", (msg) => {
    console.log("Message reçu : " + msg.body);

    // Récupérer l'ID de l'utilisateur destinataire
    const recipientId = msg.to_id;
    console.log("Recipient id : " + recipientId);

    // Diffusion du message à tous les utilisateurs connectés
    io.emit("chat message", msg);
  });
  // Gestion de la déconnexion de l'utilisateur
  socket.on("disconnect", () => {
    console.log("Un utilisateur s'est déconnecté");
  });
});

// Démarrage du serveur
const port = 3000;
http.listen(port, () => {
  console.log("Serveur en écoute sur le port " + port);
});
