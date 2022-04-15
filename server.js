"use strict";
const express = require("express");
const path = require("path");
const router = express.Router();
const { type } = require("os");
const app = require("express")();
app.use(express.static(path.join(__dirname, '/WebGL')));
app.get('/', function (_, res) {
  res.sendFile(path.join(__dirname, 'WebGL/index.html'));
});
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const debug = require("debug")("test");
const matchMaking = require("./MatchMaking");
const user = require("./Users");
const PORT = process.env.PORT || 3000;
const shotId = require("shortid");
const eastablishConection = require("./GamePlay/ClientApi").eastablishConection;


let onlineUserQ = [];

io.on("connection", (socket) => {
  console.log("a user connected " + socket.id);

  onlineUserQ.push(socket);
  for (let i = 0; i < onlineUserQ.length; i++) {
    onlineUserQ[i].emit(eastablishConection.ONLINE_PLAYERS, {
      onlinePlayers: onlineUserQ.length,
    });
  }

  socket.on(eastablishConection.ONLINE_PLAYERS, (data) => {
    socket.emit(eastablishConection.ONLINE_PLAYERS, { onlinePlayers: onlineUserQ.length });
  });
  socket.on(eastablishConection.PLAYER_REGISTRATION, (data) => {
    let id = shotId.generate();
    socket.emit(eastablishConection.PLAYER_REGISTRATION, { id });
    console.log(id);
    // let invalidId = true || data["playerId"] === "null" || data["playerId"] === "";
    // if (invalidId) {
    //   console.log("new user");
    // } else {
    //   console.log("old user");
    // }
  });
  socket.on("quit", (data) => {
    console.log(`user ${socket.id} quit`);
  });
  socket.on("showData", (data) => {
    console.log(user().showUsers());
  });
  socket.on(eastablishConection.MATCH_MAKING, (data) => {


    let newUserDetail = {
      socket: socket,
      playerId: data["playerId"],
      players: data["players"],
      profile: data["profilePic"],
    };
    socket.players = data["players"];
    matchMaking(newUserDetail);
  });
  socket.on("disconnect", () => {
    console.log("disconnected " + socket.id);
    let length = onlineUserQ.length - 1;
    for (let i = 0; i < onlineUserQ.length; i++) {
      onlineUserQ[i].emit(eastablishConection.ONLINE_PLAYERS, { onlinePlayers: length });
      if (onlineUserQ[i].id === socket.id) {
        onlineUserQ.splice(i, 1);
      }
    }
  });
});

http.listen(PORT, () => {
  console.log("listening on " + PORT);
});
