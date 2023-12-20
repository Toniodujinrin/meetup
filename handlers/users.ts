import emiter from "../lib/emiters";
import User, { userSchemas } from "../models/users";
import OTP from "../models/otps";
import Encryption from "../lib/encryption";
import { StatusCodes } from "http-status-codes";
import Helpers from "../lib/helpers";
import { ReqResPair } from "../lib/types";
import _ from "lodash";
import ImageLib from "../lib/images";

const { userEmiter } = emiter;
const encryption = new Encryption();
const {
  createUserSchema,
  verifyAccountSchema,
  verifyEmailSchema,
  getUserSchema,
  updateUserSchema,
  searchUserSchema,
  uploadImageSchema,
} = userSchemas;

userEmiter.on("get user", async ({ params, res }) => {
  const { error } = getUserSchema.validate(params);
  if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
  const { email } = params;
  try {
    const user = await User.findOne({ _id: email, isVerified: true }).select({
      username: 1,
      firstName: 1,
      lastName: 1,
      lastSeen: 1,
      resgistration: 1,
      phone: 1,
      boi: 1,
      profilePic: 1,
    });
    if (user) res.status(StatusCodes.OK).json(user);
    else res.status(StatusCodes.NOT_FOUND).send("user not found");
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("get self", async ({ req, res }: ReqResPair) => {
  try {
    const user = await User.findById(req.userId).select({
      username: 1,
      firstName: 1,
      lastName: 1,
      lastSeen: 1,
      registration: 1,
      phone: 1,
      bio: 1,
      profilePic: 1,
      defaultProfileColor: 1,
    });
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("create user", async ({ req, res }) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).send(error.message);
      return;
    } else {
      const { email, password } = req.body;
      let user = await User.findById(email);
      if (user)
        return res.status(StatusCodes.BAD_REQUEST).send("user already exists");
      const hashedPassword = Helpers.passwordHasher(password);
      user = new User({
        _id: email,
        password: hashedPassword,
      });
      await user.save();
      const otp = await Helpers.OTPSender(email, 5);
      if (otp) {
        const otpObject = new OTP({
          _id: otp,
          email,
        });
        await otpObject.save();
      }
      const payload = {
        _id: user._id,
        emailVerified: user.emailVerified,
        accountVerified: user.accountVerified,
        isVerified: user.isVerified,
      };
      const token = Helpers.generateUserToken(payload);
      res
        .header("authorization", token)
        .status(StatusCodes.CREATED)
        .json({ status: "success" });
    }
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("verify account", async ({ req, res }: ReqResPair) => {
  if (!req.emailVerified)
    return res.status(StatusCodes.UNAUTHORIZED).send("email not verified");
  try {
    const { error } = verifyAccountSchema.validate(req.body);
    if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
    const { username, firstName, lastName, phone, bio } = req.body;
    const keyPair = encryption.generateKeyPair();
    const publicKey = keyPair.publicKey;
    const encryptedKeyPair = await encryption.encryptKeyPair(keyPair);
    await req.user.updateOne({
      $set: {
        isVerified: true,
        accountVerified: true,
        username,
        firstName,
        lastName,
        phone,
        publicKey,
        bio,
        keyPair: encryptedKeyPair,
      },
    });
    const token = Helpers.generateUserToken({
      _id: req.userId,
      isVerified: true,
      emailVerified: true,
      accountVerified: true,
    });
    res
      .header("authorization", token)
      .status(StatusCodes.OK)
      .send({ status: "success" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("verify email", async ({ req, res }: ReqResPair) => {
  try {
    if (req.emailVerified)
      return res.status(StatusCodes.BAD_REQUEST).send("email already verified");
    const { error } = verifyEmailSchema.validate(req.body);
    if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
    const { otp } = req.body;
    const otpInDatabase = await OTP.findById(otp);
    if (otpInDatabase && otpInDatabase.email == req.userId) {
      await req.user.updateOne({
        $set: {
          emailVerified: true,
        },
      });
      const token = Helpers.generateUserToken({
        _id: req.userId,
        isVerified: false,
        emailVerified: true,
        accountVerified: false,
      });
      res
        .header("authorization", token)
        .status(StatusCodes.OK)
        .json({ status: "success" });
    } else return res.status(StatusCodes.BAD_REQUEST).send("Incorrect code");
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("resend otp", async ({ req, res }: ReqResPair) => {
  try {
    if (req.emailVerified)
      return res.status(StatusCodes.BAD_REQUEST).send("email already verified");
    const otp = await Helpers.OTPSender(req.userId, 5);
    if (otp) {
      const otpObject = new OTP({
        _id: otp,
        email: req.user,
      });
      otpObject.save();
      res.status(StatusCodes.OK).json({ status: "success" });
    } else
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error ");
  }
});

userEmiter.on("get conversations", async ({ req, res }: ReqResPair) => {
  try {
    const response = await User.findById(req.userId).populate({
      path: "conversations",
      populate: { path: "messages" },
    });
    if (!response) return res.status(StatusCodes.NOT_FOUND);
    let editedConversations = response.conversations.map(
      async (conversationId: any) => {
        const normalizedConversation = await Helpers.normalizeConversation(
          conversationId,
          req.userId
        );
        return normalizedConversation;
      }
    );
    let result = await Promise.all(editedConversations);
    const resultWithMessages = result.filter((conversation) => {
      if (conversation) {
        return conversation.lastMessage;
      }
    });
    resultWithMessages.sort((r1, r2) =>
      r1 && r2 && r1.lastMessage && r2.lastMessage
        ? r2.lastMessage.timeStamp - r1.lastMessage.timeStamp
        : 0
    );
    const resultWithoutMessages = result.filter((conversation) => {
      if (conversation) {
        return !conversation.lastMessage;
      }
    });
    result = [...resultWithMessages, ...resultWithoutMessages];
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("add user", async ({ req, res }: ReqResPair) => {
  try {
    const { error } = getUserSchema.validate(req.params);
    if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
    const { email } = req.params;
    if (email == req.userId)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("you cannot add yourself to contacts");
    const user = await User.findById(email);
    if (!user) return res.status(StatusCodes.NOT_FOUND).send("user not found");
    if (req.user.pendingContactsSent.includes(email))
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("you have already send a request to this user");
    if (req.user.contacts.includes(email))
      return res.status(StatusCodes.BAD_REQUEST).send("user already a contact");
    await req.user.updateOne({ $push: { pendingContactsSent: email } });
    await user.updateOne({ $push: { pendingContactsReceived: req.userId } });
    res.status(StatusCodes.OK).send({ status: "success" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("accept Request", async ({ req, res }: ReqResPair) => {
  try {
    const { error } = getUserSchema.validate(req.params);
    if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
    const { email } = req.params;
    const user = await User.findById(email);
    if (!user) return res.status(StatusCodes.NOT_FOUND).send("user not found");
    if (!req.user.pendingContactsReceived.includes(email))
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("user has not sent you a contact reqquest");
    const pendingContactsReceived = req.user.pendingContactsReceived.filter(
      (item) => item != email
    );
    const pendingContactsSent = user.pendingContactsSent.filter(
      (item) => item !== req.userId
    );
    await req.user.updateOne({
      $push: { contacts: email },
      $set: { pendingContactsReceived },
    });
    await user.updateOne({
      $push: { contacts: req.userId },
      $set: { pendingContactsSent },
    });
    res.status(StatusCodes.OK).json({ status: "success" });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("get contacts", async ({ req, res }: ReqResPair) => {
  try {
    let contacts = await User.findById(req.userId).populate({
      path: "contacts",
      select: "username _id profilePic defaultProfileColor",
    });
    res.status(StatusCodes.OK).json(contacts?.contacts);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("update user", async ({ req, res }: ReqResPair) => {
  try {
    const { error } = updateUserSchema.validate(req.body);
    if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
    await req.user.updateOne(req.body);
    res.status(StatusCodes.OK).json({ status: "success" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("get pending requests sent", async ({ req, res }: ReqResPair) => {
  try {
    let contacts = await User.findById(req.userId).populate({
      path: "pendingContactsSent",
      select: "username _id profilePic defaultProfileColor",
    });
    res.status(StatusCodes.OK).json(contacts?.pendingContactsSent);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on(
  "get pending requests received",
  async ({ req, res }: ReqResPair) => {
    try {
      let contacts = await User.findById(req.userId).populate({
        path: "pendingContactsReceived",
        select: "username _id profilePic defaultProfileColor",
      });
      res.status(StatusCodes.OK).json(contacts?.pendingContactsReceived);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
  }
);

userEmiter.on("search user", async ({ req, res }: ReqResPair) => {
  const { error } = searchUserSchema.validate(req.params);
  if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
  const { email } = req.params;
  try {
    const expression = `.*${email}.*`;
    const regex = new RegExp(expression, "g");
    const result = await User.find({
      _id: { $regex: regex },
      isVerified: true,
    }).select({ username: 1, profilePic: 1, defaultProfileColor: 1 });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("upload image", async ({ req, res }: ReqResPair) => {
  try {
    const { error } = uploadImageSchema.validate(req.body);
    if (error) return res.status(StatusCodes.BAD_REQUEST).send(error.message);
    const { image } = req.body;
    const imageObject = await new ImageLib().uploadImage(
      image,
      "profilePictures"
    );
    if (!req.user.defaultProfileColor) {
      const defaultProfileColor = Helpers.generateHexColorString();
      await req.user.updateOne({
        $set: { defaultProfileColor },
      });
    }
    if (req.user.profilePic && req.user.profilePic.public_id) {
      await new ImageLib().deleteImage(req.user.profilePic.public_id);
    }
    await req.user.updateOne({
      $set: { profilePic: imageObject },
    });
    res.status(StatusCodes.OK).json({ status: "success" });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("remove image", async ({ req, res }: ReqResPair) => {
  try {
    const { user } = req;
    if (!user.profilePic)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("no existing profile pick found");
    await new ImageLib().deleteImage(user.profilePic.public_id);
    if (!user.defaultProfileColor) {
      const profileColor = Helpers.generateHexColorString();
      user.defaultProfileColor = profileColor;
    }
    await user.updateOne(user);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("delete account", async ({ req, res }: ReqResPair) => {
  try {
    await User.findOneAndDelete({ _id: req.userId });
    res.status(StatusCodes.OK).json({ status: "success" });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});

userEmiter.on("get notifications", async ({ req, res }: ReqResPair) => {
  try {
    const { user } = req;
    const notifications = user.notifications;
    res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
});
