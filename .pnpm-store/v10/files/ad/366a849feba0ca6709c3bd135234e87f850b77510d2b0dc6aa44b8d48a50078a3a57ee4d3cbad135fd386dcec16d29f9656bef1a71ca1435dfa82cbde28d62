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
exports.uploadToAzure = void 0;
const path_1 = require("path");
const promises_1 = require("fs/promises");
const uploadToAzure = (blobService, attachments) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const azureContainerUrl = (_a = blobService.azure) === null || _a === void 0 ? void 0 : _a.azureStorageUrl;
    const azureContainerSas = (_b = blobService.azure) === null || _b === void 0 ? void 0 : _b.azureStorageSAS;
    if (!azureContainerUrl || !azureContainerSas) {
        return;
    }
    const mediaFiles = [];
    if (attachments.length > 0) {
        attachments = attachments.filter((a) => a.contentType.startsWith("image/") && a.path);
        for (const attachment of attachments) {
            try {
                if (attachment.path) {
                    const githubRunId = process.env.GITHUB_RUN_ID || "";
                    const parsedFile = (0, path_1.parse)(attachment.path);
                    let fileUrl = `${azureContainerUrl}`;
                    if (githubRunId) {
                        fileUrl = `${fileUrl}/${githubRunId}`;
                    }
                    fileUrl = `${fileUrl}/${parsedFile.name}_${Date.now()}${parsedFile.ext}`;
                    const putResponse = yield fetch(`${fileUrl}?${azureContainerSas}`, {
                        method: "PUT",
                        headers: {
                            "x-ms-blob-type": "BlockBlob",
                            "x-ms-blob-content-type": attachment.contentType,
                        },
                        body: yield (0, promises_1.readFile)(attachment.path),
                    });
                    if (putResponse.ok) {
                        mediaFiles.push({
                            name: attachment.name,
                            url: fileUrl,
                        });
                    }
                    else {
                        console.log(`Failed to upload attachment: ${attachment.name}`);
                        console.log(`Response: ${putResponse.statusText}`);
                    }
                }
            }
            catch (e) {
                console.log(`Failed to upload attachment: ${attachment.name}`);
                console.log(e.message);
            }
        }
    }
    return mediaFiles;
});
exports.uploadToAzure = uploadToAzure;
