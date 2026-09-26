"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestsPerFile = void 0;
const getTestsPerFile = (suite) => {
    // Get all the test files
    const files = suite
        .allTests()
        .map((test) => test.location.file)
        .reduce((acc, curr) => {
        if (!acc.includes(curr)) {
            acc.push(curr);
        }
        return acc;
    }, []);
    // Get all the tests per file
    const tests = files.reduce((acc, curr) => {
        acc[curr] = suite.allTests().filter((test) => {
            return test.location.file === curr;
        });
        return acc;
    }, {});
    return tests;
};
exports.getTestsPerFile = getTestsPerFile;
