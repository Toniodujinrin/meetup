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
const node_rsa_1 = __importDefault(require("node-rsa"));
class Encryption {
    constructor() {
        this.generateKeyPair = () => {
            const key = new node_rsa_1.default({ b: 512 });
            const publicKey = key.exportKey("pkcs1-public-pem").replace("\\n", "");
            const privateKey = key.exportKey("pkcs1-private-pem").replace("\\n", "");
            return { publicKey, privateKey };
        };
        this.createGroupKey = () => {
            return crypto_1.default.randomBytes(24).toString("base64");
        };
        this.extractKeysandIv = (groupKey) => {
            const groupKeyObject = JSON.parse(groupKey);
            const key = Buffer.from(groupKeyObject.key.data);
            const iv = new Uint8Array(Object.values(groupKeyObject.iv));
            return ({ key, iv });
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
            let key = {
                key: publicKey,
                padding: crypto_1.default.constants.RSA_PKCS1_PADDING
            };
            const encryptedGroupKey = crypto_1.default.publicEncrypt(key, Buffer.from(groupKey, "base64")).toString('base64');
            return encryptedGroupKey;
        };
        this.decryptGroupKey = (privateKey, encryptedGroupKey) => {
            let key = {
                key: privateKey,
                padding: crypto_1.default.constants.RSA_PKCS1_PADDING
            };
            const decryptedGroupKey = crypto_1.default.privateDecrypt(key, Buffer.from(encryptedGroupKey, 'base64')).toString("base64");
            return decryptedGroupKey;
        };
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
