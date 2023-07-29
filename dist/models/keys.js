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
const mongoose_1 = __importDefault(require("mongoose"));
const encryption_1 = __importDefault(require("../lib/encryption"));
const encryption = new encryption_1.default();
const keySchema = new mongoose_1.default.Schema({
    privateKey: Object,
    prublicKey: Object
});
const Key = mongoose_1.default.model("Key", keySchema);
const createKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, privateKey } = yield encryption.generateKeyPair();
    const key = new Key({
        privateKey: privateKey,
        prublicKey: publicKey
    });
    try {
        yield key.save();
    }
    catch (error) {
        console.log(error);
    }
});
const getKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const keys = yield Key.findById("64c42dca8b9fb583ab531a23");
    console.log(typeof (keys === null || keys === void 0 ? void 0 : keys.privateKey));
});
getKey();
