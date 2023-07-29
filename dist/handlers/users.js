"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emiters_1 = __importDefault(require("../lib/emiters"));
const users_1 = __importDefault(require("../validators/users"));
const users_2 = __importDefault(require("../models/users"));
const http_status_codes_1 = require("http-status-codes");
const helpers_1 = __importDefault(require("../lib/helpers"));
const { userEmiter } = emiters_1.default;
userEmiter.on("get user", (args) => {
    const { email, res } = args[0];
    res.send(email);
});
userEmiter.on("create user", (args) => __awaiter(void 0, void 0, void 0, function* () {
    const { body, res } = args[0];
    try {
        const { error } = users_1.default.createUserSchema.validate(body);
        if (error) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(error.message);
            return;
        }
        else {
            const { email, password } = body;
            const hashedPassword = helpers_1.default.passwordHasher(password);
            const user = new users_2.default({
                _id: email,
                password: hashedPassword
            });
            yield user.save();
            res.status(http_status_codes_1.StatusCodes.CREATED).send("user profile created");
        }
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error ");
    }
}));
