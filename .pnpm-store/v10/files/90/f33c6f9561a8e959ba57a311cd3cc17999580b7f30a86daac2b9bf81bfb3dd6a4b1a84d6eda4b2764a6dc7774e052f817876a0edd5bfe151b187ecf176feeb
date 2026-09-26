"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalStatus = void 0;
const getTestOutcome_1 = require("./getTestOutcome");
const getTotalStatus = (suites) => {
    let total = {
        passed: 0,
        failed: 0,
        skipped: 0,
        timedOut: 0,
    };
    for (const suite of suites) {
        const testOutcome = suite.allTests().map((test) => {
            const lastResult = test.results[test.results.length - 1];
            return (0, getTestOutcome_1.getTestOutcome)(test, lastResult);
        });
        for (const outcome of testOutcome) {
            if (outcome === "passed") {
                total.passed++;
            }
            else if (outcome === "failed") {
                total.failed++;
            }
            else if (outcome === "skipped") {
                total.skipped++;
            }
            else if (outcome === "timedOut") {
                total.timedOut++;
            }
        }
    }
    return total;
};
exports.getTotalStatus = getTotalStatus;
