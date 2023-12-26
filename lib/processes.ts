import Message from "../models/message";
import Conversation from "../models/conversations";
import OTP from "../models/otps";
import { Schema } from "mongoose";
import User from "../models/users";
import Helpers from "./helpers";
class Processes {
  static envChecker = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Checking environment variables ...");
    const envVariables = [
      process.env.PORT,
      process.env.MONGO_URI,
      process.env.KEY,
      process.env.EMAIL_SERVER,
      process.env.HASHING_SECRET,
      process.env.CLOUDINARY_NAME,
      process.env.CLOUDINARY_API_KEY,
      process.env.CLOUDINARY_API_SECRET,
      process.env.HTTPS,
      process.env.SERVER_CERT,
      process.env.SERVER_KEY,
      process.env.CLOUDINARY_URL,
      process.env.FULL_CHAIN,
    ];
    for (let i of envVariables) {
      if (!i) {
        console.log(
          "\x1b[31m%s\x1b[0m",
          "[x] Error: missing environmental properties, exiting ..."
        );
        process.exit(1);
      }
    }
    console.log(
      "\x1b[32m%s\x1b[0m",
      "[o] All environment variables available ..."
    );
  };

  static otpProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] OTP process started ...");
    setInterval(async () => {
      await OTP.deleteMany({ timestamp: { $lt: Date.now() - 300000 } });
    }, 10000);
  };

  static messageProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Message process started ...");
    setInterval(async () => {
      await Message.deleteMany({ timeStamp: { $lt: Date.now() - 86400000 } });
    }, 10000);
  };

  static conversationProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Conversation process started ...");
    setInterval(async () => {
      const conversations = await Conversation.find({
        "messages.0": { $exists: true },
      });
      if (conversations) {
        const conversationProcess = conversations.map(async (conversation) => {
          const obsoleteMessages: Schema.Types.ObjectId[] = [];
          const findObsoleteMessagesProcess = conversation.messages.map(
            async (message) => {
              if (!(await Message.findById(message))) {
                obsoleteMessages.push(message);
              }
            }
          );
          await Promise.all(findObsoleteMessagesProcess);
          const filteredConversationMessages = conversation.messages.filter(
            (message) => !obsoleteMessages.includes(message)
          );
          await Conversation.updateOne(
            { _id: conversation._id },
            { $set: { messages: filteredConversationMessages } }
          );
        });
        await Promise.all(conversationProcess);
      }
    }, 1000 * 60 * 5);
  };

  static notificationProcess = () => {
    console.log("\x1b[33m%s\x1b[0m", "[+] Notifications process started ...");
    setInterval(async () => {
      const users = await User.find({ "notifications.0": { $exists: true } });
      if (users) {
        const userProcess = users.map(async (user) => {
          const notifications = user.notifications.filter((notification) => {
            if (notification.timeStamp) {
              return notification.timeStamp + 86400000 > Date.now();
            }
          });
          await user.updateOne({
            notifications,
          });
        });
        await Promise.all(userProcess);
      }
    }, 10000);
  };

  static tempProcess = async () => {
    const users = await User.find({ defaultProfileColor: { $exists: true } });
    if (users) {
      const userProcess = users.map(async (user) => {
        const defaultProfileColor = Helpers.generateHexColorString();
        await user.updateOne({
          defaultProfileColor,
        });
      });
      await Promise.all(userProcess);
    }
  };
}

export default Processes;
