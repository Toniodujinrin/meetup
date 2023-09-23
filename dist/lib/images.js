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
const cloudinary_1 = __importDefault(require("cloudinary"));
class ImageLib {
    constructor() {
        cloudinary_1.default.v2.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
    }
    uploadImage(image, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            const { public_id, secure_url: url } = yield cloudinary_1.default.v2.uploader.upload(image, { folder: folder });
            return { public_id, url };
        });
    }
    deleteImage(public_id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield cloudinary_1.default.v2.uploader.destroy(public_id);
        });
    }
}
exports.default = ImageLib;
