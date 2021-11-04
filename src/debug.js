/**
 * @fileoverview Exports utility functions for logging at a specific level
 * Also monkey patches minecraft-protocol to include logging.
 */

import mc from "minecraft-protocol";

const LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    silly: 3,
    absurd: 4,
};
const debugLevel = process.env.DBGLEVEL === undefined ? 2 : LEVELS[process.env.DBGLEVEL];

if (debugLevel >= LEVELS.absurd) {
    mc.Client.prototype._write = mc.Client.prototype.write;
    mc.Client.prototype.write = function (...args) {
        console.log("[absurd] Client write:", ...args);
        this._write(...args);
    };

    mc.Client.prototype._emit = mc.Client.prototype.emit;
    mc.Client.prototype.emit = function (...args) {
        console.error("[absurd] Client emit:", ...args);
        this._emit(...args);
    };
}

function logFactory(levelThreshold, ...preargs) {
    return function (...args) {
        if (debugLevel >= levelThreshold) {
            switch( levelThreshold )
            {
                case LEVELS.absurd:
                console.debug(...preargs, ...args);
                break;

                case LEVELS.silly:
                console.debug(...preargs, ...args);
                break;
                
                case LEVELS.info:
                console.info(...preargs, ...args);
                break;
                
                case LEVELS.warn:
                console.warn(...preargs, ...args);
                break;
                
                case LEVELS.error:
                console.error(...preargs, ...args);
                break;

                default:
                console.log(...preargs, ...args);
            }
        }
    };
}

export const silly = logFactory(LEVELS.silly, "\x1b[35m[silly]\x1b[0m");
export const info  = logFactory(LEVELS.info, "\x1b[36m[info]\x1b[0m");
export const warn  = logFactory(LEVELS.warn, "\x1b[33m[warn]\x1b[0m");
export const error = logFactory(LEVELS.error, "\x1b[31m[error]\x1b[0m");
