"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestStatusIcon = void 0;
const getTestStatus_1 = require("./getTestStatus");
const getTestStatusIcon = (test, result) => {
    let value = (0, getTestStatus_1.getTestStatus)(test, result);
    if (value === "Flaky") {
        value = `⚠️`;
    }
    else if (value === "Pass") {
        value = "✅";
    }
    else if (value === "Skipped") {
        value = `⏭️`;
    }
    else if (value === "Fail") {
        value = "❌";
    }
    return value;
};
exports.getTestStatusIcon = getTestStatusIcon;
