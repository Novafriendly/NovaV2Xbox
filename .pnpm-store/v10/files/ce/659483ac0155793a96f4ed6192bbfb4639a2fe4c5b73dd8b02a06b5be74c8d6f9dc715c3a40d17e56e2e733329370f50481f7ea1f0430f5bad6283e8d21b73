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
exports.getTableRows = void 0;
const ansi_to_html_1 = __importDefault(require("ansi-to-html"));
const getTestStatus_1 = require("./getTestStatus");
const getTestTitle_1 = require("./getTestTitle");
const getTestTags_1 = require("./getTestTags");
const getTestAnnotations_1 = require("./getTestAnnotations");
const getTestDuration_1 = require("./getTestDuration");
const getTestStatusIcon_1 = require("./getTestStatusIcon");
const processAttachments_1 = require("./processAttachments");
const getTableRows = (tests, showAnnotations, showTags, showError, displayLevel, showAnnotationsInColumn = false, blobService) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const convert = new ansi_to_html_1.default();
    const hasBlobService = blobService && blobService.azure;
    const tableHeaders = [
        {
            data: "Test",
            header: true,
        },
        {
            data: "Status",
            header: true,
        },
        {
            data: "Duration",
            header: true,
        },
        {
            data: "Retries",
            header: true,
        },
    ];
    if (showTags) {
        tableHeaders.push({
            data: "Tags",
            header: true,
        });
    }
    if (showAnnotations && showAnnotationsInColumn) {
        tableHeaders.push({
            data: "Annotations",
            header: true,
        });
    }
    if (showError) {
        tableHeaders.push({
            data: "Error",
            header: true,
        });
        if (hasBlobService) {
            tableHeaders.push({
                data: "Attachments",
                header: true,
            });
        }
    }
    const tableRows = [];
    for (const test of tests) {
        // Get the last result
        const result = test.results[test.results.length - 1];
        // Check if the test should be shown
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
                tableRows.push([
                    {
                        data: annotations,
                        header: false,
                        colspan: `${colLength}`,
                    },
                ]);
            }
        }
        const tableRow = [
            {
                data: (0, getTestTitle_1.getTestTitle)(test),
                header: false,
            },
            {
                data: `${(0, getTestStatusIcon_1.getTestStatusIcon)(test, result)} ${testStatus}`,
                header: false,
            },
            {
                data: (0, getTestDuration_1.getTestDuration)(result),
                header: false,
            },
            {
                data: `${(result === null || result === void 0 ? void 0 : result.retry) || ""}`,
                header: false,
            },
        ];
        if (showTags) {
            tableRow.push({
                data: (0, getTestTags_1.getTestTags)(test),
                header: false,
            });
        }
        if (showAnnotations && showAnnotationsInColumn) {
            const annotations = yield (0, getTestAnnotations_1.getTestAnnotations)(test);
            if (annotations) {
                tableRow.push({
                    data: annotations,
                    header: false,
                });
            }
            else {
                tableRow.push({
                    data: "",
                    header: false,
                });
            }
        }
        if (showError) {
            const error = ((_a = result === null || result === void 0 ? void 0 : result.error) === null || _a === void 0 ? void 0 : _a.message) || "";
            tableRow.push({
                data: convert.toHtml(error),
                header: false,
            });
            if (hasBlobService) {
                const mediaFiles = (yield (0, processAttachments_1.processAttachments)(blobService, result.attachments)) || [];
                tableRow.push({
                    data: (mediaFiles || [])
                        .map((m) => `<p align="center"><img src="${m.url}" alt="${m.name}" width="250"></p>
<p align="center"><b>${m.name}</b></p>`)
                        .join("\n\n"),
                    header: false,
                });
            }
        }
        tableRows.push(tableRow);
    }
    if (tableRows.length === 0) {
        return [];
    }
    return [tableHeaders, ...tableRows];
});
exports.getTableRows = getTableRows;
