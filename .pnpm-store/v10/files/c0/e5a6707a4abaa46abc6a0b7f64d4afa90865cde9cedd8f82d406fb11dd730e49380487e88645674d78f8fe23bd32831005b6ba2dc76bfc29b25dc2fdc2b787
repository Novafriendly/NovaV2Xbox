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
const processResults_1 = require("./utils/processResults");
class GitHubAction {
    constructor(options = {
        showAnnotations: true,
        showAnnotationsInColumn: false,
        showTags: true,
        quiet: false,
    }) {
        this.options = options;
        console.log(`Using GitHub Actions reporter`);
        // Set default options
        if (typeof options.showAnnotations === "undefined") {
            this.options.showAnnotations = true;
        }
        if (typeof options.showAnnotationsInColumn === "undefined") {
            this.options.showAnnotationsInColumn = false;
        }
        if (typeof options.showTags === "undefined") {
            this.options.showTags = true;
        }
        if (typeof options.includeResults === "undefined") {
            this.options.includeResults = ["fail", "flaky", "pass", "skipped"];
        }
        if (process.env.NODE_ENV === "development" || options.debug) {
            console.log(`Using development mode`);
            console.log(`Options: ${JSON.stringify(this.options, null, 2)}`);
        }
    }
    onBegin(_, suite) {
        this.suite = suite;
    }
    onStdOut(chunk, _, __) {
        if (this.options.quiet) {
            return;
        }
        const text = chunk.toString("utf-8");
        process.stdout.write(text);
    }
    onStdErr(chunk, _, __) {
        if (this.options.quiet) {
            return;
        }
        const text = chunk.toString("utf-8");
        process.stderr.write(text);
    }
    onEnd(result) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, processResults_1.processResults)(this.suite, this.options);
            if ((result === null || result === void 0 ? void 0 : result.status) !== "passed") {
                core.setFailed("Tests failed");
            }
        });
    }
}
exports.default = GitHubAction;
