"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestOutcome = void 0;
const getTestOutcome = (test, result) => {
    if (result === null || result === void 0 ? void 0 : result.status) {
        return result.status;
    }
    const testOutcome = test.outcome();
    switch (testOutcome) {
        case "expected":
            return "passed";
        case "flaky":
        case "unexpected":
            return "failed";
        default:
            return testOutcome;
    }
};
exports.getTestOutcome = getTestOutcome;
