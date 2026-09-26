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
exports.getHtmlTable = void 0;
const ansi_to_html_1 = __importDefault(require("ansi-to-html"));
const getTestStatus_1 = require("./getTestStatus");
const getTestStatusIcon_1 = require("./getTestStatusIcon");
const getTestTitle_1 = require("./getTestTitle");
const getTestTags_1 = require("./getTestTags");
const getTestAnnotations_1 = require("./getTestAnnotations");
const getTestDuration_1 = require("./getTestDuration");
const processAttachments_1 = require("./processAttachments");
const getHtmlTable = (tests, showAnnotations, showTags, showError, displayLevel, showAnnotationsInColumn = false, blobService) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const convert = new ansi_to_html_1.default();
    const hasBlobService = blobService && blobService.azure;
    const content = [];
    content.push(`<br>`);
    content.push(`<table role="table">`);
    content.push(`<thead>`);
    content.push(`<tr>`);
    content.push(`<th>Test</th>`);
    content.push(`<th>Status</th>`);
    content.push(`<th>Duration</th>`);
    content.push(`<th>Retries</th>`);
    if (showTags) {
        content.push(`<th>Tags</th>`);
    }
    if (showAnnotations && showAnnotationsInColumn) {
        content.push(`<th>Annotations</th>`);
    }
    if (showError) {
        content.push(`<th>Error</th>`);
        if (hasBlobService) {
            content.push(`<th>Attachments</th>`);
        }
    }
    content.push(`</tr>`);
    content.push(`</thead>`);
    content.push(`<tbody>`);
    const testRows = [];
    for (const test of tests) {
        // Get the last result
        const result = test.results[test.results.length - 1];
        const testStatus = (0, getTestStatus_1.getTestStatus)(test, result);
        if (!displayLevel.includes(testStatus.toLowerCase())) {
            continue;
        }
        if (showAnnotations && !showAnnotationsInColumn && test.annotations) {
            let colLength = 4;
            if (showTags) {
                colLength++;
            }
            if (showError) {
                colLength++;
                if (hasBlobService) {
                    colLength++;
                }
            }
            const annotations = yield (0, getTestAnnotations_1.getTestAnnotations)(test);
            if (annotations) {
                testRows.push(`<tr>`);
                testRows.push(`<td colspan="${colLength}">${annotations}</td>`);
                testRows.push(`</tr>`);
            }
        }
        testRows.push(`<tr>`);
        testRows.push(`<td>${(0, getTestTitle_1.getTestTitle)(test)}</td>`);
        testRows.push(`<td>${(0, getTestStatusIcon_1.getTestStatusIcon)(test, result)} ${(0, getTestStatus_1.getTestStatus)(test, result)}</td>`);
        testRows.push(`<td>${(0, getTestDuration_1.getTestDuration)(result)}</td>`);
        testRows.push(`<td>${(result === null || result === void 0 ? void 0 : result.retry) || ""}</td>`);
        if (showTags) {
            testRows.push(`<td>${(0, getTestTags_1.getTestTags)(test)}</td>`);
        }
        if (showAnnotations && showAnnotationsInColumn) {
            const annotations = yield (0, getTestAnnotations_1.getTestAnnotations)(test);
            if (annotations) {
                testRows.push(`<td>${annotations}</td>`);
            }
            else {
                testRows.push(`<td></td>`);
            }
        }
        if (showError) {
            const error = ((_a = result === null || result === void 0 ? void 0 : result.error) === null || _a === void 0 ? void 0 : _a.message) || "";
            testRows.push(`<td>${convert.toHtml(error)}</td>`);
            if (hasBlobService) {
                const mediaFiles = (yield (0, processAttachments_1.processAttachments)(blobService, result.attachments)) || [];
                const mediaLinks = mediaFiles
                    .map((m) => `<p align="center"><img src="${m.url}" alt="${m.name}" width="250"></p>
<p align="center"><b>${m.name}</b></p>`)
                    .join(", ");
                testRows.push(`<td>${mediaLinks}</td>`);
            }
        }
        testRows.push(`</tr>`);
    }
    if (testRows.length === 0) {
        return;
    }
    content.push(testRows.join("\n"));
    content.push(`</tbody>`);
    content.push(`</table>`);
    return content.join("\n");
});
exports.getHtmlTable = getHtmlTable;
