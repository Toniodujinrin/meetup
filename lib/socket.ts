import { Socket, Server } from "socket.io";
import User from "../models/users";
import Conversation from "../models/conversations";
import Message from "../models/message";
import _ from "lodash";
import {
  MessageInterface,
  MessageInterfacePopulated,
  SocketInterface,
} from "./types";
import Helpers from "./helpers";

class SocketLib {
  static getAllSocketsInRoom = async (io: Server, room: string) => {
    const clients = await io.in(room).fetchSockets();
    const ids = clients.map((client: any) => {
      return client.user;
    });
    return ids;
  };

  static getAllSocketsInRoomWithIds = async (io: Server, room: string) => {
    const clients = await io.in(room).fetchSockets();
    const ids = clients.map((client: any) => {
      return { userId: client.user, socketId: client.id };
    });
    return ids;
  };

  static leaveAllRooms = async (socket: SocketInterface, io: Server) => {
    try {
      for (let room of socket.rooms) {
        if (room !== socket.id) {
          let ids = await this.getAllSocketsInRoom(io, room);
          ids = ids.filter((id) => id !== socket.user);
          io.to(room).emit("onlineUsers", ids);
        }
      }
    } catch (error) {
      socket.emit("leave_error", error);
    }
  };

  static leaveRoom = async (
    socket: Socket,
    io: Server,
    conversationId: string
  ) => {
    try {
      await socket.leave(conversationId);
      const ids = await this.getAllSocketsInRoom(io, conversationId);
      io.to(conversationId).emit("onlineUsers", ids);
    } catch (error) {
      socket.emit("leave_error", error);
    }
  };

  static getAllSockets = async (io: Server) => {
    const client = await io.fetchSockets();
    const ids = client.map((client: any) => {
      return client.user;
    });
    return ids;
  };

  static getSocketIdFromUserId = async (io: Server, userId: string) => {
    const client = await io.fetchSockets();
    let socketId;
    client.map((client: any) => {
      if (client.user == userId) socketId = client.id;
    });
    return socketId;
  };

  //room for optimization
  static getAllOnlineContacts = async (
    userId: string | undefined,
    io: Server
  ) => {
    const user = await User.findById(userId);
    const onlineContacts = [];
    if (user) {
      const contacts = user.contacts;
      const onlineUsers = await this.getAllSockets(io);
      for (let contact of contacts) {
        if (onlineUsers.includes(contact)) {
          onlineContacts.push(contact);
        }
      }
    }
    return onlineContacts;
  };

  static sendMessage = async (
    io: Server,
    body: string,
    conversationId: string,
    senderId: string | undefined
  ) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("conversation not found");

    let message = new Message({
      conversationId,
      body,
      senderId,
    });
    message = await message.save();
    const _message = await message.populate({
      path: "senderId",
      select: "_id username profilePic",
    });
    io.to(conversationId).emit("new_message", _message);

    // send notification to users not in conversation

    const onlineSockets = await this.getAllSocketsInRoom(io, conversationId);
    const users = conversation.users;
    const proc = users.map(async (userId) => {
      if (!onlineSockets.includes(userId)) {
        const user = await User.findById(userId);
        if (user) {
          if (!user.notifications) user.notifications = [];
          const notificationExists = user.notifications.find(
            (notification) => notification.conversationId == conversationId
          );
          if (notificationExists) {
            user.notifications.map((notification) => {
              if (
                notification.conversationId == conversationId &&
                notification.amount
              ) {
                notification.amount += 1;
                notification.timeStamp = Date.now();
              }
            });
          } else
            user.notifications.unshift({
              conversationId,
              amount: 1,
              timeStamp: Date.now(),
            });
          user.notifications.sort((n1, n2) =>
            n1.timeStamp && n2.timeStamp ? n2.timeStamp - n1.timeStamp : 0
          );
          await user.updateOne({
            $set: {
              notifications: user.notifications,
            },
          });
          const normalizedNotifcations =
            await Helpers.getNormalizedNotifications(userId);
          const socketId = await this.getSocketIdFromUserId(io, userId);
          if (socketId)
            io.to(socketId).emit("new_notification", normalizedNotifcations);
        }
      }
    });
    await Promise.all(proc);
  };

  static updateLastSeen = async (email: string | undefined) => {
    await User.findByIdAndUpdate(email, {
      $set: { lastSeen: Date.now() },
    });
  };

  static getUserGroupKey = async (
    email: string | undefined,
    conversationId: string
  ) => {
    const user = await User.findById(email);
    if (user && user.conversations) {
      const conversation = user.conversationKeys.find(
        (conversation) => conversation.conversationId == conversationId
      );
      if (!conversation) throw new Error("unauthorized user");
      return conversation.groupKey;
    }
    throw new Error("invalid user");
  };

  static getPreviousMessages = async (
    conversationId: string | undefined,
    socket: any
  ) => {
    try {
      let previousMessages = await Conversation.findById(
        conversationId
      ).populate<{ messages: MessageInterface[] }>("messages");
      if (previousMessages) {
        const messages = previousMessages.messages;
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.senderId !== socket.user) {
            const proc = messages.map(async (message) => {
              if (message.status !== "read") {
                await Message.findByIdAndUpdate(message._id, {
                  $set: { status: "read" },
                });
              }
            });
            await Promise.all(proc);
          }
        }
        const updatedPreviousMessages = await Conversation.findById(
          conversationId
        ).populate<{ messages: MessageInterfacePopulated[] }>({
          path: "messages",
          populate: {
            path: "senderId",
            select: "_id username profilePic defaultProfileColor",
          },
        });
        return updatedPreviousMessages?.messages;
      }
    } catch (error) {
      socket.emit("previousMessages_error", error);
    }
  };

  static clearNotifications = async (
    conversationId: string,
    socket: SocketInterface
  ) => {
    try {
      const user = await User.findById(socket.user);
      if (!user) throw new Error("user not found");
      const notifications = user.notifications.filter(
        (notification) => notification.conversationId !== conversationId
      );
      await user.updateOne({ $set: { notifications } });
      socket.emit("notification", notifications);
    } catch (error) {
      socket.emit("clearNotifications_error", error);
    }
  };

  static notifyOnline = async (socket: SocketInterface, io: Server) => {
    try {
      const user = await User.findById(socket.user);
      if (!user) throw new Error("user not found");
      const process = user.contacts.map(async (contact) => {
        const socketId = await this.getSocketIdFromUserId(io, contact);
        if (socketId) {
          io.to(socketId).emit("newOnlineContact", socket.user);
        }
      });
      await Promise.all(process);
    } catch (error) {
      socket.emit("notifyOnline_error", error);
    }
  };

  static notifyOffline = async (socket: SocketInterface, io: Server) => {
    try {
      const user = await User.findById(socket.user);
      if (!user) throw new Error("user not found");
      const process = user.contacts.map(async (contact) => {
        const socketId = await this.getSocketIdFromUserId(io, contact);
        if (socketId) {
          io.to(socketId).emit("newOfflineContact", socket.user);
        }
      });
      await Promise.all(process);
    } catch (error) {
      socket.emit("notifyOffline_error", error);
    }
  };

  static signalCall = async (
    offer: any,
    conversationId: string,
    socket: SocketInterface,
    io: Server
  ) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return socket.emit(
        "offerSignalError",
        new Error("socket does not exist")
      );
    if (conversation.type == "group")
      return socket.emit(
        "offerSignalError",
        new Error("socket does not exist")
      );
    const receiver = conversation.users.filter(
      (user) => user !== socket.user
    )[0];
    if (receiver) {
      const recieverSocketId = await this.getSocketIdFromUserId(io, receiver);
      if (!recieverSocketId)
        return socket.emit("offerSignalError", new Error("user unavailable"));
      io.to(recieverSocketId).emit("call", { offer, conversationId });
    }
  };

  static signalIceCandidate = async (
    iceCandidate: any,
    conversationId: string,
    socket: SocketInterface,
    io: Server
  ) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return socket.emit(
        "iceCandidateSignalError",
        new Error("socket does not exist")
      );
    if (conversation.type == "group")
      return socket.emit(
        "iceCandidateSignalError",
        new Error("socket does not exist")
      );
    const receiver = conversation.users.filter(
      (user) => user !== socket.user
    )[0];
    if (receiver) {
      const recieverSocketId = await this.getSocketIdFromUserId(io, receiver);
      if (!recieverSocketId)
        return socket.emit(
          "iceCandidateSignalError",
          new Error("user unavailable")
        );
      io.to(recieverSocketId).emit("new_iceCandidate", iceCandidate);
    }
  };

  static signalResponse = async (
    answer: any,
    conversationId: string,
    socket: SocketInterface,
    io: Server
  ) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return socket.emit(
        "replySignalError",
        new Error("socket does not exist")
      );
    if (conversation.type == "group")
      return socket.emit(
        "replySignalError",
        new Error("socket does not exist")
      );
    const receiver = conversation.users.filter(
      (user) => user !== socket.user
    )[0];
    if (receiver) {
      const recieverSocketId = await this.getSocketIdFromUserId(io, receiver);
      if (!recieverSocketId)
        return socket.emit("replySignalError", new Error("user unavailable"));
      io.to(recieverSocketId).emit("call_response", answer);
    }
  };

  static rejectCall = async (
    conversationId: string,
    io: Server,
    socket: SocketInterface
  ) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return socket.emit(
        "rejectCallError",
        new Error("conversation does not exist")
      );
    }
    const receiver = conversation.users.filter(
      (user) => user !== socket.user
    )[0];
    if (receiver) {
      const receiverSocketId = await this.getSocketIdFromUserId(io, receiver);
      if (!receiverSocketId) {
        return socket.emit("rejectCallError", new Error("receiver not online"));
      }
      io.to(receiverSocketId).emit("call_rejected");
    }
  };

  static callTimeout = async (
    conversationId: string,
    io: Server,
    socket: SocketInterface
  ) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return socket.emit(
        "callTimeoutError",
        new Error("conversation does not exist")
      );
    }
    const receiver = conversation.users.filter(
      (user) => user !== socket.user
    )[0];
    if (receiver) {
      const receiverSocketId = await this.getSocketIdFromUserId(io, receiver);
      if (!receiverSocketId) {
        return socket.emit(
          "callTimeoutError",
          new Error("receiver not online")
        );
      }
      io.to(receiverSocketId).emit("call_timeout");
    }
  };
}

export default SocketLib;
