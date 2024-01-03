import { Server, Socket } from "socket.io";
import authorization from "../middleware/socketAuthentication";
import SocketLib from "../lib/socket";
import User from "../models/users";
import { SocketInterface } from "../lib/types";

const socketHandler = (io: Server) => {
  io.use(authorization);

  io.on("connection", async (socket: SocketInterface) => {
    console.log("user connected", socket.user);
    const onlineContacts = await SocketLib.getAllOnlineContacts(
      socket.user,
      io
    );
    const user = await User.findById(socket.user);
    socket.emit("notification", user?.notifications);
    socket.emit("onlineContacts", onlineContacts);
    await SocketLib.notifyOnline(socket, io);

    socket.on("join", async ({ conversationId }) => {
      try {
        const groupKey = await SocketLib.getUserGroupKey(
          socket.user,
          conversationId
        );
        socket.emit("groupKey", groupKey);
        socket.join(conversationId);
        await SocketLib.clearNotifications(conversationId, socket);
        const previousMessages = await SocketLib.getPreviousMessages(
          conversationId,
          socket
        );
        io.to(conversationId).emit("previousMessages", previousMessages);
        const onlineUsers = await SocketLib.getAllSocketsInRoom(
          io,
          conversationId
        );
        io.to(conversationId).emit("onlineUsers", onlineUsers);
      } catch (error) {
        console.log(error);
        socket.emit("join_error", error);
      }
    });

    socket.on("leaveRoom", async ({ conversationId }) => {
      await SocketLib.leaveRoom(socket, io, conversationId);
      await SocketLib.updateLastSeen(socket.user);
    });

    socket.on("messageRead", async ({ conversationId }) => {
      const previousMessages = await SocketLib.getPreviousMessages(
        conversationId,
        socket
      );
      io.to(conversationId).emit("previousMessages", previousMessages);
    });

    socket.on("message", async ({ body, conversationId }) => {
      try {
        await SocketLib.sendMessage(io, body, conversationId, socket.user);
      } catch (error) {
        console.log(error);
        socket.emit("message_error", error);
      }
    });

    socket.on("typing", ({ conversationId }) => {
      io.to(conversationId).emit("typing", socket.user);
    });

    socket.on("finished typing", ({ conversationId }) => {
      io.to(conversationId).emit("finished typing", socket.user);
    });

    socket.on("disconnecting", async () => {
      try {
        await SocketLib.leaveAllRooms(socket, io);
        await SocketLib.notifyOffline(socket, io);
        await SocketLib.updateLastSeen(socket.user);
      } catch (error) {
        console.log(error);
        socket.emit("leave_error", error);
      }
    });

    socket.on("call", async ({ offer, conversationId }) => {
      try {
        await SocketLib.signalCall(offer, conversationId, socket, io);
      } catch (error) {
        console.log(error);
        socket.emit("signaling_error", error);
      }
    });

    socket.on("new_iceCandidate", async ({ iceCandidate, conversationId }) => {
      try {
        await SocketLib.signalIceCandidate(
          iceCandidate,
          conversationId,
          socket,
          io
        );
      } catch (error) {
        console.log(error);
        socket.emit("signaling_error", error);
      }
    });

    socket.on("call_response", async ({ answer, conversationId }) => {
      try {
        await SocketLib.signalResponse(answer, conversationId, socket, io);
      } catch (error) {
        console.log(error);
        socket.emit("signaling_error", error);
      }
    });

    socket.on("call_rejected", async ({ conversationId }) => {
      try {
        await SocketLib.rejectCall(conversationId, io, socket);
      } catch (error) {
        console.log(error);
        socket.emit("rejectCallError", error);
      }
    });

    socket.on("call_timeout", async ({ conversationId }) => {
      try {
        await SocketLib.callTimeout(conversationId, io, socket);
      } catch (error) {
        console.log(error);
        socket.emit("callTimeoutError");
      }
    });
  });
};

export default socketHandler;
