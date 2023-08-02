"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("user connected");
    });
    const adminSpace = io.of("/admin");
    adminSpace.on("connection", (socket) => {
        console.log("user connected");
        socket.on("test", (args) => {
            console.log(args);
        });
        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });
};
exports.default = socketHandler;
