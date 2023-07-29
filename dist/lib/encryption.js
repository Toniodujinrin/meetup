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
const crypto_1 = __importDefault(require("crypto"));
const util_1 = __importDefault(require("util"));
const randomFillPromise = util_1.default.promisify(crypto_1.default.randomFill);
const scryptPromise = util_1.default.promisify(crypto_1.default.scrypt);
const generateKeyPairPromise = util_1.default.promisify(crypto_1.default.generateKeyPair);
class Encryption {
    constructor() {
        this.chunkBuffer = (buffer, size) => {
            const chunks = [];
            for (let i = 0; i < buffer.length; i += size) {
                chunks.push(new Uint8Array(buffer.subarray(i, i + size)));
            }
            return chunks;
        };
        this.generateKeyPair = () => __awaiter(this, void 0, void 0, function* () {
            const options = {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: "spki",
                    format: "pem"
                },
                privateKeyEncoding: {
                    type: "pkcs8",
                    format: "pem"
                }
            };
            const keyPair = yield generateKeyPairPromise("rsa", options);
            return keyPair;
        });
        this.createGroupKeyAndVector = () => __awaiter(this, void 0, void 0, function* () {
            const iv = yield randomFillPromise(new Uint8Array(16));
            const key = yield scryptPromise("password", "salt", 24);
            const groupKeyAndVector = {
                key: key,
                iv: iv
            };
            return JSON.stringify(groupKeyAndVector);
        });
        this.extractKeysandIv = (groupKey) => {
            const groupKeyObject = JSON.parse(groupKey);
            const key = Buffer.from(groupKeyObject.key.data);
            const iv = new Uint8Array(Object.values(groupKeyObject.iv));
            return ({ key: key, iv: iv });
        };
        this.encryptMessage = (data, key, iv) => __awaiter(this, void 0, void 0, function* () {
            try {
                let encrypted = "";
                const cipher = crypto_1.default.createCipheriv(this.algorithm, key, iv);
                encrypted = cipher.update(data, "utf-8", "base64");
                encrypted += cipher.final("base64");
                if (encrypted)
                    return encrypted;
            }
            catch (error) {
                console.log(error);
            }
        });
        this.decryptMessage = (data, key, iv) => __awaiter(this, void 0, void 0, function* () {
            try {
                let decrypted = "";
                const decipher = crypto_1.default.createDecipheriv(this.algorithm, key, iv);
                decrypted = decipher.update(data, "base64", "utf8");
                decrypted += decipher.final("utf-8");
                if (decrypted)
                    return decrypted;
            }
            catch (error) {
                console.log(error);
            }
        });
        this.encryptGroupKey = (publicKey, groupKey) => {
            const publicKeyBuffer = Buffer.from(publicKey, "base64");
            const groupKeyBuffer = Buffer.from(groupKey);
            try {
                const encryptedGroupKey = crypto_1.default.publicEncrypt(publicKeyBuffer, groupKeyBuffer);
                return encryptedGroupKey.toString("base64");
            }
            catch (error) {
                console.log("could not encrypt public key");
            }
        };
        this.decryptGroupKey = (privateKey, encryptedGroupKey) => {
            const privateKeyBuffer = Buffer.from(privateKey, "base64");
            const encryptedGroupKeyBuffer = Buffer.from(encryptedGroupKey, "base64");
            try {
                const decryptedGroupKey = crypto_1.default.privateDecrypt(privateKeyBuffer, encryptedGroupKeyBuffer);
                return this.extractKeysandIv(decryptedGroupKey.toString("utf-8"));
            }
            catch (error) {
                console.log(error);
            }
        };
        this.sendMessage = (message, groupKey) => __awaiter(this, void 0, void 0, function* () {
            const { key, iv } = groupKey;
            const encryptedMessage = yield this.encryptMessage(message, key, iv);
            return (encryptedMessage);
        });
        this.readMessage = (encryptedMessage, groupKey) => __awaiter(this, void 0, void 0, function* () {
            const { key, iv } = groupKey;
            const decrypted = yield this.decryptMessage(encryptedMessage, key, iv);
            return (decrypted);
        });
        this.encryptKeyPair = (keyPair) => __awaiter(this, void 0, void 0, function* () {
            const groupKey = process.env.KEY;
            if (typeof groupKey == "string") {
                const { key, iv } = this.extractKeysandIv(groupKey);
                const stringedKeyPair = JSON.stringify(keyPair);
                const encryptedKeyPair = yield this.encryptMessage(stringedKeyPair, key, iv);
                return encryptedKeyPair;
            }
            else {
                throw new Error("could not encrypt key pair");
            }
        });
        this.decryptKeyPair = (encryptedKeyPair) => __awaiter(this, void 0, void 0, function* () {
            const groupKey = process.env.KEY;
            if (typeof groupKey == "string") {
                const { key, iv } = this.extractKeysandIv(groupKey);
                const decryptedKeyPair = yield this.decryptMessage(encryptedKeyPair, key, iv);
                if (decryptedKeyPair) {
                    const keyPair = JSON.parse(decryptedKeyPair);
                    return keyPair;
                }
                else {
                    throw new Error("could not decrypt data");
                }
            }
            else {
                throw new Error("could not find decryption key");
            }
        });
        this.algorithm = "aes-192-cbc";
    }
}
exports.default = Encryption;
