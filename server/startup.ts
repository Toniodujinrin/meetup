import express, { Express } from "express";
import users from "../routes/users";
import auth from "../routes/auth";
import conversations from "../routes/conversations";
import cors from "cors";
import bodyParser from "body-parser";
import Processes from "../lib/processes";

const startup = (app: Express) => {
  Processes.otpProcess();
  Processes.messageProcess();
  Processes.conversationProcess();
  Processes.notificationProcess();
  //Processes.tempProcess();
  app.use(express.static("public"));
  app.use(
    cors({
      exposedHeaders: ["authorization"],
    })
  );
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(
    bodyParser.urlencoded({
      limit: "50mb",
      extended: true,
      parameterLimit: 50000,
    })
  );

  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/conversations", conversations);
};

export default startup;
