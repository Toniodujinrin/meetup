"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const restriction = (req, res, next) => {
    if (req.isVerified) {
        next();
    }
    else {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("you are not authorized to perform this action");
    }
};
exports.default = restriction;
