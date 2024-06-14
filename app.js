const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  // cors: {
  //   origin: [
  //     "http://localhost:4200",
  //     "https://shokii.com/",
  //     "https://local.shokii.com/",
  //   ],
  //   methods: ["GET", "POST"],
  // },
  cors: {
    origin: "*",
  },
});
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const serviceAccount = require("./ServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shokii-push.firebaseio.com",
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    if (userId) {
      console.log(`L'utilisateur avec l'ID ${userId} s'est déconnecté`);
      onlineUsers.delete(userId);
      io.emit("onlineUsers", Array.from(onlineUsers));
    }
  });
});

const sendNotification = (token, title, body) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    android: {
      notification: {
        clickAction: "news_intent",
        icon: "https://us.123rf.com/450wm/blinkblink1/blinkblink12005/blinkblink1200500015/146979464-avatar-ic%C3%B4ne-de-l-homme.jpg?ver=6",
        color: "#7e55c3",
      },
    },
    webpush: {
      notification: {
        requireInteraction: true,
        icon: "https://us.123rf.com/450wm/blinkblink1/blinkblink12005/blinkblink1200500015/146979464-avatar-ic%C3%B4ne-de-l-homme.jpg?ver=6",
      },
      fcm_options: {
        link: "https://shokii.com",
      },
    },
    token: token,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      if (
        error.errorInfo.code === "messaging/registration-token-not-registered"
      ) {
        // Handle the case where the token is not registered
        console.log("Token is not registered. Handle accordingly.");
        // Optionally, remove the token from your database
      }
    });
};

app.post("/sendNotification", (req, res) => {
  const { token, title, body } = req.body;
  sendNotification(token, title, body);
  res.status(200).send("Notification envoyée");
});

const port = 3000;
http.listen(port, () => {
  console.log("Serveur en écoute sur le port " + port);
});
