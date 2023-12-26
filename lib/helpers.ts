import crypto from "crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import { MessageInterface, UserInterface } from "./types";
import Conversation from "../models/conversations";
import User from "../models/users";
import _ from "lodash";

class Helpers {
  static passwordHasher = (str: string) => {
    const secret = process.env.HASHING_SECRET;
    if (typeof secret == "string") {
      let hash = crypto.createHmac("sha256", secret).update(str).digest("hex");
      return hash;
    } else {
      throw new Error("hashing secret not found");
    }
  };

  static OTPSender = async (email: string, length: number) => {
    const acceptedchars = "1234567890";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += acceptedchars[Math.floor(Math.random() * acceptedchars.length)];
    }
    const payload = {
      receiver: email,
      subject: "OTP for Sign up",
      from: "Meet Up",
      text: `use this code as your one time password ${result}`,
    };
    try {
      await axios.post(`${process.env.EMAIL_SERVER}/send`, payload);

      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  static generateUserToken = (payload: any) => {
    const key = process.env.KEY;
    if (typeof key == "string") {
      const token = `Bearer ${jwt.sign(payload, key)}`;
      return token;
    } else throw new Error("could not generate token");
  };

  static checkIfSubset = (arr1: string[], arr2: string[]) => {
    let isSubset = true;
    for (let item of arr2) {
      if (!arr1.includes(item)) {
        isSubset = false;
        break;
      }
    }

    return isSubset;
  };

  static normalizeConversation = async (
    conversationId: string,
    userId: string
  ) => {
    const conversation = await Conversation.findById(conversationId)
      .populate<{
        messages: MessageInterface[];
      }>({ path: "messages" })
      .populate<{ users: UserInterface[] }>({
        path: "users",
        select: "username _id lastSeen profilePic defaultProfileColor",
      });
    if (!conversation) return null;
    let _conversation = _.pick(conversation, [
      "type",
      "users",
      "name",
      "created",
      "conversationPic",
      "lastSeen",
      "_id",
      "defaultConversationColor",
      "lastMessage",
    ]);
    if (_conversation.type == "single") {
      const otherUser = conversation.users.filter(
        (user) => user._id != userId
      )[0];
      if (!otherUser) return null;
      _conversation.name = otherUser.username;
      _conversation.conversationPic = otherUser.profilePic;
      _conversation.lastSeen = otherUser.lastSeen;
      _conversation.defaultConversationColor = otherUser.defaultProfileColor;
    }
    _conversation.lastMessage =
      conversation.messages.length > 0
        ? conversation.messages[conversation.messages.length - 1]
        : undefined;

    return _conversation;
  };

  static getNormalizedNotifications = async (userId: string) => {
    const user = await User.findById(userId);
    if (user) {
      let normalizedNotifcations = user.notifications.map(
        async (notification: any) => {
          let _notification: {
            amount?: number;
            timeStamp?: number;
            conversationId?: string;
            _id?: string;
            conversationDetails?: any;
          } = {};
          _notification = _.pick(notification, [
            "amount",
            "conversationId",
            "timeStamp",
            "_id",
          ]);

          _notification.conversationDetails = await this.normalizeConversation(
            notification.conversationId,
            userId
          );
          return _notification;
        }
      );
      const _normalizedNotifcations = await Promise.all(normalizedNotifcations);
      return _normalizedNotifcations;
    }
  };

  static generateHexColorString = () => {
    const possibleColors = [
      "#59AB83",
      "#79A470",
      "#AA5CBB",
      "#5CB15F",
      "#6888B5",
      "#B48377",
      "#90A2BF",
      "#6D5CB3",
      "#93816B",
      "#876C8B",
      "#895460",
      "#8CA169",
      "#8B7168",
      "#935269",
      "#6F8ABE",
      "#C7C761",
      "#7069B8",
      "#B3B686",
      "#858FAE",
      "#A898B0",
      "#ACA471",
      "#6B8499",
      "#8367C5",
      "#52B0C4",
      "#B38379",
      "#66A2AB",
      "#BD5D9A",
      "#AE7264",
      "#80915E",
      "#A0535A",
      "#9B8661",
      "#597F65",
      "#C29476",
      "#6D6E57",
      "#6C6984",
      "#7F6E64",
      "#918D5F",
      "#7DBFC5",
      "#AF9D5E",
      "#699795",
      "#A4829F",
      "#75B486",
      "#8E6156",
      "#988563",
      "#76719A",
      "#855EAF",
      "#C1A16A",
      "#C0B2BD",
      "#789C6E",
    ];
    const string =
      possibleColors[Math.floor(Math.random() * possibleColors.length)];
    return string;
  };
}

export default Helpers;
