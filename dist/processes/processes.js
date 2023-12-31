"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Processes {
}
Processes.envChecker = () => {
    if (process.env.PORT && process.env.MONGO_URI && process.env.KEY, process.env.EMAIL_SERVER, process.env.HASHING_SECRET)
        return;
    else {
        console.log("\x1b[31m%s\x1b[0m", "Error: missing environmental properties, exiting ...");
        process.exit(1);
    }
};
exports.default = Processes;
