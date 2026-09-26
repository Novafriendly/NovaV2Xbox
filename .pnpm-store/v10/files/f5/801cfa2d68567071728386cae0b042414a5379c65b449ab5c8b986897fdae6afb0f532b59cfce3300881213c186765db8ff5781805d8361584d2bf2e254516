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
exports.processResults = void 0;
const core = __importStar(require("@actions/core"));
const summary_1 = require("@actions/core/lib/summary");
const fs_1 = require("fs");
const path_1 = require("path");
const getHtmlTable_1 = require("./getHtmlTable");
const getSuiteStatusIcon_1 = require("./getSuiteStatusIcon");
const getTableRows_1 = require("./getTableRows");
const getSummaryTitle_1 = require("./getSummaryTitle");
const getSummaryDetails_1 = require("./getSummaryDetails");
const getTestsPerFile_1 = require("./getTestsPerFile");
const getTestHeading_1 = require("./getTestHeading");
const processResults = (suite, options) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === "development") {
        const summaryFile = (0, path_1.join)(__dirname, "../../summary.html");
        if ((0, fs_1.existsSync)(summaryFile)) {
            (0, fs_1.unlinkSync)(summaryFile);
        }
        (0, fs_1.writeFileSync)(summaryFile, "", "utf-8");
        process.env[summary_1.SUMMARY_ENV_VAR] = summaryFile;
        process.env.GITHUB_ACTIONS = "true";
    }
    if (process.env.GITHUB_ACTIONS && suite) {
        const os = process.platform;
        const summary = core.summary;
        let blobService = undefined;
        if (options.azureStorageSAS && options.azureStorageUrl) {
            blobService = {};
            blobService.azure = {};
            blobService.azure.azureStorageSAS = options.azureStorageSAS;
            blobService.azure.azureStorageUrl = options.azureStorageUrl;
        }
        if (options.showArtifactsLink) {
            summary.addLink("Go to artifacts", "#artifacts");
        }
        const summaryTitle = (0, getSummaryTitle_1.getSummaryTitle)(options.title);
        if (summaryTitle) {
            summary.addHeading(summaryTitle, 1);
        }
        const headerText = (0, getSummaryDetails_1.getSummaryDetails)(suite);
        summary.addRaw(headerText.join(` - `));
        if (options.useDetails) {
            summary.addSeparator();
        }
        for (const crntSuite of suite === null || suite === void 0 ? void 0 : suite.suites) {
            const project = crntSuite.project();
            const tests = (0, getTestsPerFile_1.getTestsPerFile)(crntSuite);
            for (const filePath of Object.keys(tests)) {
                const fileName = (0, path_1.basename)(filePath);
                if (options.useDetails) {
                    const content = yield (0, getHtmlTable_1.getHtmlTable)(tests[filePath], options.showAnnotations, options.showTags, !!options.showError, options.includeResults, options.showAnnotationsInColumn, blobService);
                    if (!content) {
                        continue;
                    }
                    // Check if there are any failed tests
                    const testStatusIcon = (0, getSuiteStatusIcon_1.getSuiteStatusIcon)(tests[filePath]);
                    summary.addDetails(`${testStatusIcon} ${(0, getTestHeading_1.getTestHeading)(fileName, os, project)}`, content);
                }
                else {
                    const tableRows = yield (0, getTableRows_1.getTableRows)(tests[filePath], options.showAnnotations, options.showTags, !!options.showError, options.includeResults, options.showAnnotationsInColumn, blobService);
                    if (tableRows.length !== 0) {
                        summary.addHeading((0, getTestHeading_1.getTestHeading)(fileName, os, project), 2);
                        summary.addTable(tableRows);
                    }
                }
            }
        }
        yield summary.write();
    }
});
exports.processResults = processResults;
