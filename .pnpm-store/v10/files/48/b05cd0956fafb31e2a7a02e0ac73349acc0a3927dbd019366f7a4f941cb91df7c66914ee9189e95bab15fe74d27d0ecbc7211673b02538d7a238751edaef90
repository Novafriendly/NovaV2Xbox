"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummaryDetails = void 0;
const getTotalStatus_1 = require("./getTotalStatus");
const getSummaryDetails = (suite) => {
    const totalStatus = (0, getTotalStatus_1.getTotalStatus)(suite.suites);
    const headerText = [`Total tests: ${suite.allTests().length}`];
    if (totalStatus.passed > 0) {
        headerText.push(`Passed: ${totalStatus.passed}`);
    }
    if (totalStatus.failed > 0) {
        headerText.push(`Failed: ${totalStatus.failed}`);
    }
    if (totalStatus.skipped > 0) {
        headerText.push(`Skipped: ${totalStatus.skipped}`);
    }
    if (totalStatus.timedOut > 0) {
        headerText.push(`Timed Out: ${totalStatus.timedOut}`);
    }
    return headerText;
};
exports.getSummaryDetails = getSummaryDetails;
