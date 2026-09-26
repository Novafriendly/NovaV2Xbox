"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuiteStatusIcon = void 0;
const getTestOutcome_1 = require("./getTestOutcome");
const getSuiteStatusIcon = (tests) => {
    if (!tests || tests.length === 0) {
        return "❌";
    }
    const testOutcomes = tests.map((test) => {
        const lastResult = test.results[test.results.length - 1];
        const outcome = test.outcome();
        if (outcome === "flaky") {
            return "flaky";
        }
        return (0, getTestOutcome_1.getTestOutcome)(test, lastResult);
    });
    if (testOutcomes.includes("failed") ||
        testOutcomes.includes("interrupted") ||
        testOutcomes.includes("timedOut")) {
        return "❌";
    }
    else if (testOutcomes.includes("flaky")) {
        return "⚠️";
    }
    return "✅";
};
exports.getSuiteStatusIcon = getSuiteStatusIcon;
