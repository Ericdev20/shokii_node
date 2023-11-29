const express = require("express");
const app = express();
const http = require("http").createServer(app);

const io = require("socket.io")(http, {
  // cors: {
  //   origin: ["http://localhost:4200", "https://shokii.com/"],
  //   methods: ["GET", "POST"],
  // },
   cors: {
      origin: '*',
    }
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

app.use(express.static("public"));

const onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("Un utilisateur est connecté");

  socket.on("userConnected", (userId) => {
    console.log(`L'utilisateur avec l'ID ${userId} est en ligne`);
    onlineUsers.add(userId);
    io.emit("onlineUsers", Array.from(onlineUsers));
  });

  socket.on("chat message", (msg) => {
    console.log("Message reçu : " + msg.body);
    const recipientId = msg.to_id;
    console.log("Recipient id : " + recipientId);
    io.emit("chat message", msg);
  });

  socket.on("disconnected", (userId) => {
    // const userId = Array.from(onlineUsers).find(
    //   (id) => id === socket.id
    // );
    if (userId) {
      console.log(`L'utilisateur avec l'ID ${userId} s'est déconnecté`);
      onlineUsers.delete(userId);
      io.emit("onlineUsers", Array.from(onlineUsers));
    }
  });
});

const port = 3000;
http.listen(port, () => {
  console.log("Serveur en écoute sur le port " + port);
});
