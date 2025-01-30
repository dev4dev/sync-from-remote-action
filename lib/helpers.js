"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemoteVersion = getRemoteVersion;
exports.getLocalVersion = getLocalVersion;
exports.execPromise = execPromise;
const exec = __importStar(require("@actions/exec"));
// import * as core from '@actions/core'
const semver_1 = require("semver");
function getRemoteVersion(repo) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = yield execPromise(`git ls-remote --tags --sort="-v:refname" ${repo}`);
        const versions = output.split('\n');
        return extractVersionFromLogs(versions);
    });
}
function getLocalVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = yield execPromise(`git remote get-url origin`);
        return (yield getRemoteVersion(url)).version;
    });
}
function extractVersionFromLogs(logs) {
    const matched = logs
        .flatMap(line => {
        const match = line.match(new RegExp('refs/tags/v?\\d+.\\d+.\\d+$'));
        if (match) {
            return match;
        }
        else {
            return null;
        }
    })
        .flatMap(x => (x ? [x] : []))
        .map(line => {
        var _a, _b, _c, _d;
        const version = (_c = (_b = (_a = line.split(new RegExp('\\s'))) === null || _a === void 0 ? void 0 : _a.pop()) === null || _b === void 0 ? void 0 : _b.split('/')) === null || _c === void 0 ? void 0 : _c.pop();
        const tag = (_d = line.split('\t').shift()) !== null && _d !== void 0 ? _d : '';
        return {
            version: new semver_1.SemVer(version !== null && version !== void 0 ? version : '0.0.0'),
            tag
        };
    })
        .sort((lhs, rhs) => {
        return lhs.version.compare(rhs.version);
    });
    const result = matched.pop();
    if (result) {
        return result;
    }
    else {
        return {
            version: new semver_1.SemVer('0.0.0'),
            tag: ''
        };
    }
}
function execPromise(command) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield exec.getExecOutput(command, []);
        return result.stdout;
    });
}
