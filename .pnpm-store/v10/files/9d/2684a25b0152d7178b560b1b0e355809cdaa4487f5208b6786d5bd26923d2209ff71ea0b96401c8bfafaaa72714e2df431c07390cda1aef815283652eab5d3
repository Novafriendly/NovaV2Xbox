"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestStatus = void 0;
const getTestOutcome_1 = require("./getTestOutcome");
const getTestStatus = (test, result) => {
    let value = "";
    let status = (0, getTestOutcome_1.getTestOutcome)(test, result);
    if (status === "passed" && result.retry > 0) {
        value = `Flaky`;
    }
    else if (status === "passed") {
        value = "Pass";
    }
    else if (status === "skipped") {
        value = `Skipped`;
    }
    else {
        value = "Fail";
    }
    return value;
};
exports.getTestStatus = getTestStatus;
