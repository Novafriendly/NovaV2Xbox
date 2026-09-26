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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestAnnotations = void 0;
const marked_1 = require("marked");
const getTestAnnotations = (test) => __awaiter(void 0, void 0, void 0, function* () {
    if (!test || !test.annotations) {
        return "";
    }
    let list = [];
    const isList = test.annotations.length > 1;
    for (const annotation of test.annotations) {
        list.push(`${isList ? "- " : ""}**${annotation.type}**: ${annotation.description}`);
    }
    const markdown = list.join("\n");
    return (yield marked_1.marked.parse(markdown)).trim();
});
exports.getTestAnnotations = getTestAnnotations;
