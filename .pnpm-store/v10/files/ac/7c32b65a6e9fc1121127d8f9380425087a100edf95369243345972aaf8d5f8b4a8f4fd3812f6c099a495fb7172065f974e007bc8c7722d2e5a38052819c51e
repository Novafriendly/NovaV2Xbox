"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestTags = void 0;
/**
 * Retrieves the tags associated with a test case.
 *
 * @param test - The test case object.
 * @returns A string containing the tags separated by commas.
 */
const getTestTags = (test) => {
    var _a;
    return (((_a = test === null || test === void 0 ? void 0 : test.tags) === null || _a === void 0 ? void 0 : _a.map((t) => (t.startsWith(`@`) ? t.substring(1) : t)).join(", ")) || "");
};
exports.getTestTags = getTestTags;
