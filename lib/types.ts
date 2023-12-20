import { Request, Response } from "express";
import { Socket } from "socket.io";
import mongoose from "mongoose";
import { ObjectId } from "mongoose";

interface RequestInterface extends Request {
  user: UserInterface;
  userId: string;
  emailVerified: boolean;
  accountVerfied: boolean;
  isVerified: boolean;
}
interface ReqResPair {
  req: RequestInterface;
  res: Response;
}
interface SocketInterface extends Socket {
  user?: string;
}

interface ConversationInterface extends mongoose.Document {
  users: string[];
  name: string;
  type: string;
  created: number;
  messages: ObjectId[];
  defaultConversationColor: string;
  conversationPic: {
    url: string;
    public_id: string;
  } | null;
  lastSeen: Number;
  lastMessage: MessageInterface | undefined;
}

interface MessageInterface extends mongoose.Document {
  conversationId: string;
  timeStamp: number;
  status: string;
  body: String;
  senderId: { type: String; ref: "User" };
}

interface MessageInterfacePopulated extends mongoose.Document {
  timeStamp: number;
  status: string;
  body: String;
  senderId: UserInterface;
}

interface UserInterface extends mongoose.Document {
  password: string;
  username: string;
  phone: String;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  accountVerified: boolean;
  pendingContactsSent: string[];
  pendingContactsReceived: string[];
  contacts: string[];
  notifications: {
    conversationId: string;
    amount: number;
    timeStamp: number;
  }[];
  isVerified: boolean;
  lastSeen: number;
  registration: number;
  defaultProfileColor: string;
  profilePic: {
    url: string;
    public_id: string;
  } | null;
  bio: string;
  conversations: string[];
  conversationKeys: { conversationId: string; groupKey: string }[];
  publicKey: string;
  keyPair: string;
}
export {
  RequestInterface,
  ReqResPair,
  SocketInterface,
  ConversationInterface,
  MessageInterface,
  UserInterface,
  MessageInterfacePopulated,
};
