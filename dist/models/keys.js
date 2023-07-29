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
    _id: { type: String, required: true },
    keys: { type: String, required: true }
});
const Key = mongoose_1.default.model("Key", keySchema);
const createKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const keyPair = yield encryption.generateKeyPair();
    const encrypedKeyPair = yield encryption.encryptKeyPair(keyPair);
    const key = new Key({
        _id: "todujinrin@gmail.com",
        keys: encrypedKeyPair
    });
    try {
        yield key.save();
        console.log("saved to database");
    }
    catch (error) {
        console.log(error);
    }
});
// createKey()
const getKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const keys = yield Key.findById("todujinrin@gmail.com").select({ keys: 1 });
    if (keys) {
        const keyPairs = yield encryption.decryptKeyPair(keys.keys);
        console.log(keyPairs);
    }
});
