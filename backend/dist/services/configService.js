"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const googleService_1 = require("./googleService");
const TAB_NAME = '_SYS_CONFIG';
// Simple in-memory cache
let configCache = {};
exports.ConfigService = {
    /**
     * Initializes the config by loading from Google Sheets.
     * Should be called on server start.
     */
    async load() {
        try {
            // Priority: Master Spreadsheet ID from ENV
            const spreadsheetId = process.env.GOOGLE_SHEET_ID_JOBS || process.env.GOOGLE_SHEET_ID;
            if (!spreadsheetId) {
                console.warn("No Google Sheet ID found in ENV for config load");
                return;
            }
            const rows = await googleService_1.GoogleService.readTab(spreadsheetId, TAB_NAME);
            if (rows.length < 2) {
                console.log("Config tab is empty or header-only");
                return;
            }
            // Mapped from Key-Value rows (skip header)
            const loadedConfig = {};
            rows.slice(1).forEach(row => {
                const [key, value] = row;
                if (key) {
                    try {
                        // Parse arrays or objects (like 'users')
                        loadedConfig[key] = (value?.startsWith('[') || value?.startsWith('{'))
                            ? JSON.parse(value)
                            : value;
                    }
                    catch {
                        loadedConfig[key] = value;
                    }
                }
            });
            configCache = loadedConfig;
            console.log("Config loaded from Google Sheets ✅");
        }
        catch (error) {
            console.error("Failed to load config from Sheets:", error);
        }
    },
    getConfig: () => {
        return configCache;
    },
    async saveConfig(newConfig) {
        try {
            configCache = { ...configCache, ...newConfig };
            const spreadsheetId = process.env.GOOGLE_SHEET_ID_JOBS || process.env.GOOGLE_SHEET_ID;
            if (!spreadsheetId)
                return false;
            const header = ['key', 'value'];
            const rows = [
                header,
                ...Object.entries(configCache).map(([k, v]) => [
                    k,
                    typeof v === 'object' ? JSON.stringify(v) : String(v)
                ])
            ];
            await googleService_1.GoogleService.writeTab(spreadsheetId, TAB_NAME, rows);
            return true;
        }
        catch (error) {
            console.error("Error saving config to Sheets:", error);
            return false;
        }
    },
    get: (key) => {
        // AI Key Priority: Environment Variable > Sheets/Cache (for security/stability)
        if (key === 'geminiApiKey' && process.env.GEMINI_API_KEY) {
            return process.env.GEMINI_API_KEY;
        }
        // Priority for others: In-memory/Sheets cache > Environment Variable
        if (configCache[key])
            return configCache[key];
        // Map config keys to Env vars for fallback
        const envMap = {
            geminiApiKey: 'GEMINI_API_KEY',
            googleSheetId: 'GOOGLE_SHEET_ID',
            googleSheetIdJobs: 'GOOGLE_SHEET_ID_JOBS',
            googleDriveFolderId: 'GOOGLE_DRIVE_FOLDER_ID',
            googleDriveFolderIdJobs: 'GOOGLE_DRIVE_FOLDER_ID_JOBS',
            googleDocTemplateId: 'GOOGLE_DOC_TEMPLATE_ID',
            serviceAccountJson: 'GOOGLE_APPLICATION_CREDENTIALS_JSON',
            systemPassword: 'SYSTEM_PASSWORD',
            users: 'SYSTEM_USERS', // JSON string of users e.g. ["Alice", "Bob"]
            googleAppsScriptUrl: 'GOOGLE_APPS_SCRIPT_URL'
        };
        const envValue = process.env[envMap[key]];
        // Special handling for array types from Env
        if (key === 'users' && envValue) {
            try {
                return JSON.parse(envValue);
            }
            catch (e) {
                return envValue.split(','); // Fallback: comma separated
            }
        }
        return envValue;
    }
};
