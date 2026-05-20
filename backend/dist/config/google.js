"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocsClient = exports.getSheetsClient = exports.getDriveClient = void 0;
const googleapis_1 = require("googleapis");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const configService_1 = require("../services/configService");
dotenv_1.default.config();
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
];
const getAuth = () => {
    // 1. Try GOOGLE_SERVICE_ACCOUNT_JSON env (base64) — for cloud deployments
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (b64) {
        try {
            const json = Buffer.from(b64, 'base64').toString('utf-8');
            const credentials = JSON.parse(json);
            return new googleapis_1.google.auth.GoogleAuth({ credentials, scopes: SCOPES });
        }
        catch (e) {
            console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e);
        }
    }
    // 2. Try ConfigService (Dynamic JSON Content)
    const jsonContent = configService_1.ConfigService.get('serviceAccountJson');
    if (jsonContent) {
        try {
            const credentials = JSON.parse(jsonContent);
            return new googleapis_1.google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });
        }
        catch (e) {
            console.error("Invalid Service Account JSON in config", e);
        }
    }
    // 3. Fallback to GOOGLE_APPLICATION_CREDENTIALS file path (local dev only)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return new googleapis_1.google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: SCOPES,
        });
    }
    // 3. Last Resort: Check local file (Only if exists, to avoid crash)
    const localKeyPath = path_1.default.join(__dirname, '../../service-account.json');
    try {
        // Using fs inside try-catch just to be safe, though GoogleAuth might handle it.
        // Better to return a dummy auth or throw a clear error than let GoogleAuth crash on file read
        return new googleapis_1.google.auth.GoogleAuth({
            keyFile: localKeyPath,
            scopes: SCOPES,
        });
    }
    catch (e) {
        console.error("No valid credentials found.");
        throw new Error("Google Config Error: No credentials provided.");
    }
};
const getDriveClient = () => googleapis_1.google.drive({ version: 'v3', auth: getAuth() });
exports.getDriveClient = getDriveClient;
const getSheetsClient = () => googleapis_1.google.sheets({ version: 'v4', auth: getAuth() });
exports.getSheetsClient = getSheetsClient;
const getDocsClient = () => googleapis_1.google.docs({ version: 'v1', auth: getAuth() });
exports.getDocsClient = getDocsClient;
