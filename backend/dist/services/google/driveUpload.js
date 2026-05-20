"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSlip = uploadSlip;
const axios_1 = __importDefault(require("axios"));
const configService_1 = require("../configService");
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZK2kRgPLXTb0LPn7Lsv2vfbfGeN2gPs5ZAfkAE5fbCr7Erij57HgqGWnqbAsK3VObYg/exec';
async function uploadSlip(file, contextName, date, prefix = 'JobSummary') {
    try {
        let folderId = prefix === 'Jobs'
            ? configService_1.ConfigService.get('googleDriveFolderIdJobs')
            : configService_1.ConfigService.get('googleDriveFolderId');
        if (!folderId) {
            folderId = configService_1.ConfigService.get('googleDriveFolderId');
        }
        const proxyUrl = configService_1.ConfigService.get('googleAppsScriptUrl') || DEFAULT_APPS_SCRIPT_URL;
        if (folderId && proxyUrl) {
            const payload = {
                base64: file.buffer.toString('base64'),
                fileName: `${date || new Date().toISOString().split('T')[0]}_${contextName || 'Job'}_${Date.now()}.jpg`,
                mimeType: file.mimetype,
                folderId,
            };
            const response = await axios_1.default.post(proxyUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.data && response.data.status === 'success') {
                return response.data.url;
            }
            throw new Error(response.data?.message || 'Proxy returned an error');
        }
        throw new Error('No Upload Method Configured (Drive Folder ID or Proxy URL)');
    }
    catch (error) {
        console.error('Error uploading via Proxy:', error.message);
        return 'UPLOAD_FAILED';
    }
}
