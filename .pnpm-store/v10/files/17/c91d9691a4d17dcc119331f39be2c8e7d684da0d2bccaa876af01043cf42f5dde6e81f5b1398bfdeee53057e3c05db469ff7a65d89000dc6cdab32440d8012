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
exports.processAttachments = void 0;
const uploadToAzure_1 = require("./blobServices/uploadToAzure");
const processAttachments = (blobService, attachments) => __awaiter(void 0, void 0, void 0, function* () {
    if (!blobService || !attachments || attachments.length === 0) {
        return;
    }
    if (blobService.azure) {
        return yield (0, uploadToAzure_1.uploadToAzure)(blobService, attachments);
    }
    return undefined;
});
exports.processAttachments = processAttachments;
