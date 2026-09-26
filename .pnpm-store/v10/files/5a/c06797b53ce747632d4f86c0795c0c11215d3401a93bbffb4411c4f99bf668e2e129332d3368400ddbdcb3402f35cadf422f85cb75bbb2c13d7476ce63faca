"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestTitle = void 0;
const getTestTitle = (test) => {
    if (!test) {
        return "";
    }
    const parent = test.parent;
    if (!parent || !parent.title) {
        return test.title;
    }
    return `${parent.title} > ${test.title}`;
};
exports.getTestTitle = getTestTitle;
