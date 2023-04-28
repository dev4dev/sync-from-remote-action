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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const glob = __importStar(require("@actions/glob"));
const helpers_1 = require("./helpers");
const semver_1 = require("semver");
const remoteRepoDirName = '__remote__source__';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const source = core.getInput('source');
            // 0. Clone current repo
            // uses: actions/checkout@v3
            core.startGroup('Precheck');
            // 1. Get remote version
            const remoteVersion = yield (0, helpers_1.getRemoteVersion)(source);
            core.info(`Remote version: ${remoteVersion}`);
            // 2. Get local version
            const localVersion = yield (0, helpers_1.getLocalVersion)();
            core.info(`Local version: ${localVersion}`);
            // 3. Compare version
            const needsSync = (0, semver_1.gt)(remoteVersion.version, localVersion);
            core.info(`Needs sync: ${needsSync}`);
            core.endGroup();
            if (!needsSync) {
                core.setOutput('synced', false);
                return;
            }
            core.startGroup('Syncing...');
            // SYNC IF NEEDED
            // Delete nonhidden local files (??)
            const localItems = yield glob.create('*', {
                implicitDescendants: false
            });
            const allLocal = yield localItems.glob();
            const visibleLocal = allLocal.filter(file => {
                var _a, _b;
                const parts = file.split('/');
                const hidden = (_b = (_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.startsWith('.')) !== null && _b !== void 0 ? _b : false;
                return !hidden;
            });
            core.info('Removing local stuff...');
            for (const file of visibleLocal) {
                core.info(`Deleting ${file}...`);
                yield io.rmRF(file);
            }
            // check local content
            core.info(`local content ${(yield exec.getExecOutput(`ls -ahl`)).stdout}`);
            // Clone remote repo
            yield exec.exec(`git clone ${source} ${remoteRepoDirName}`);
            yield exec.getExecOutput(`git checkout ${remoteVersion.tag}`, [], {
                cwd: remoteRepoDirName
            });
            const rls = yield exec.getExecOutput(`ls -ahl`, [], {
                cwd: remoteRepoDirName
            });
            core.info(`remote content ${rls.stdout}`);
            // Copy remote files
            const remoteItems = yield glob.create(`./${remoteRepoDirName}/*`, {
                implicitDescendants: false
            });
            const allRemote = yield remoteItems.glob();
            const visibleRemote = allRemote.filter(file => {
                var _a, _b;
                const parts = file.split('/');
                const hidden = (_b = (_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.startsWith('.')) !== null && _b !== void 0 ? _b : false;
                return !hidden;
            });
            core.info('Copying remote files...');
            for (const file of visibleRemote) {
                core.info(`Copying ${file}...`);
                yield io.cp(file, './', {
                    recursive: true,
                    force: true
                });
            }
            // Delete parent repo
            yield io.rmRF(`./${remoteRepoDirName}`);
            // check local content
            core.info(`local content ${(yield exec.getExecOutput(`ls -ahl`)).stdout}`);
            core.endGroup();
            core.setOutput('synced', true);
            core.setOutput('version', remoteVersion.version.format());
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
run();
