#!/usr/bin/env node

import path from "path";
import childProcess from "child_process";
import { config } from "./config.js";
import { silly, info, error } from "./debug.js";
import Server from "./server.js";
import dirname from "./dirname.cjs";
const { __dirname } = dirname;


function executeCommand(name) {
    const command = config.commands[name];
    if (!command) {
        error(`Unknown command ${name}`);
        return;
    }
    info(`Executing command ${name}: ${command}`);
    childProcess.exec(
        command,
        { cwd: path.join(__dirname, "..") },
        (err, stdout, stderr) => {
            if (err) {
                error(
                    `Command ${name} failed (${err.name} ${
                        err.message
                    }):\n${stderr.toString()}`
                );
                return;
            }
            info(`Command ${name} finished:\n${stdout.toString()}`);
        }
    );
}

const server = new Server(25565, config.target.host, config.target.port);
server.on("start", () => {
    executeCommand("start");
});
server.on("stop", () => {
    executeCommand("shutdown");
});
