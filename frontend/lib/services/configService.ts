import { GoogleService } from './googleService';

export interface AppConfig {
    geminiApiKey?: string;
    googleSheetId?: string; // Legacy/ClearBill
    googleSheetIdJobs?: string; // New: Daily Job Summary
    googleDriveFolderId?: string; // Legacy/ClearBill Images
    googleDriveFolderIdJobs?: string; // New: Daily Job Summary Images
    googleDocTemplateId?: string;
    serviceAccountJson?: string; // Stored as stringified JSON
    systemPassword?: string;
    users?: string[]; // New: List of assignees
    googleAppsScriptUrl?: string; // Image Upload Proxy Endpoint
    groqApiKey?: string; // New: Groq API Key
}

const TAB_NAME = '_SYS_CONFIG';

// Simple in-memory cache
let configCache: AppConfig = {};

export const ConfigService = {
    /**
     * Initializes the config by loading from Google Sheets.
     * Should be called on server start.
     */
    async load(): Promise<void> {
        try {
            // Priority: Master Spreadsheet ID from ENV
            const spreadsheetId = process.env.GOOGLE_SHEET_ID_JOBS || process.env.GOOGLE_SHEET_ID;
            if (!spreadsheetId) {
                console.warn("No Google Sheet ID found in ENV for config load");
                return;
            }

            const rows = await GoogleService.readTab(spreadsheetId, TAB_NAME);
            if (rows.length < 2) {
                console.log("Config tab is empty or header-only");
                return;
            }

            // Mapped from Key-Value rows (skip header)
            const loadedConfig: any = {};
            rows.slice(1).forEach(row => {
                const [key, value] = row;
                if (key) {
                    try {
                        // Parse arrays or objects (like 'users')
                        loadedConfig[key] = (value?.startsWith('[') || value?.startsWith('{'))
                            ? JSON.parse(value)
                            : value;
                    } catch {
                        loadedConfig[key] = value;
                    }
                }
            });

            configCache = loadedConfig;
            console.log("Config loaded from Google Sheets ✅");
        } catch (error) {
            console.error("Failed to load config from Sheets:", error);
        }
    },

    getConfig: (): AppConfig => {
        return configCache;
    },

    async saveConfig(newConfig: AppConfig): Promise<boolean> {
        try {
            configCache = { ...configCache, ...newConfig };

            const spreadsheetId = process.env.GOOGLE_SHEET_ID_JOBS || process.env.GOOGLE_SHEET_ID;
            if (!spreadsheetId) return false;

            const header = ['key', 'value'];
            const rows = [
                header,
                ...Object.entries(configCache).map(([k, v]) => [
                    k,
                    typeof v === 'object' ? JSON.stringify(v) : String(v)
                ])
            ];

            await GoogleService.writeTab(spreadsheetId, TAB_NAME, rows);
            return true;
        } catch (error) {
            console.error("Error saving config to Sheets:", error);
            return false;
        }
    },

    get: (key: keyof AppConfig): any => {
        // AI Key Priority: Environment Variable > Sheets/Cache (for security/stability)
        if (key === 'geminiApiKey' && process.env.GEMINI_API_KEY) {
            return process.env.GEMINI_API_KEY;
        }

        // GROQ key
        if (key === 'googleAppsScriptUrl') {
            return configCache[key] || process.env.GOOGLE_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
        }

        // Groq Key Priority: Environment Variable > Sheets/Cache
        if (key === 'groqApiKey' && process.env.GROQ_API_KEY) {
            return process.env.GROQ_API_KEY;
        }

        // googleSheetIdJobs: fallback to GOOGLE_SHEET_ID if GOOGLE_SHEET_ID_JOBS not set
        if (key === 'googleSheetIdJobs') {
            return configCache[key] ||
                process.env.GOOGLE_SHEET_ID_JOBS ||
                process.env.GOOGLE_SHEET_ID;
        }

        // googleDriveFolderIdJobs: fallback to GOOGLE_DRIVE_FOLDER_ID
        if (key === 'googleDriveFolderIdJobs') {
            return configCache[key] ||
                process.env.GOOGLE_DRIVE_FOLDER_ID_JOBS ||
                process.env.GOOGLE_DRIVE_FOLDER_ID;
        }

        // Priority for others: In-memory/Sheets cache > Environment Variable
        if (configCache[key]) return configCache[key];

        // Map config keys to Env vars for fallback
        const envMap: Record<keyof AppConfig, string> = {
            geminiApiKey: 'GEMINI_API_KEY',
            googleSheetId: 'GOOGLE_SHEET_ID',
            googleSheetIdJobs: 'GOOGLE_SHEET_ID',
            googleDriveFolderId: 'GOOGLE_DRIVE_FOLDER_ID',
            googleDriveFolderIdJobs: 'GOOGLE_DRIVE_FOLDER_ID',
            googleDocTemplateId: 'GOOGLE_DOC_TEMPLATE_ID',
            serviceAccountJson: 'GOOGLE_APPLICATION_CREDENTIALS_JSON',
            systemPassword: 'SYSTEM_PASSWORD',
            users: 'SYSTEM_USERS',
            googleAppsScriptUrl: 'GOOGLE_SCRIPT_URL',
            groqApiKey: 'GROQ_API_KEY'
        };

        const envValue = process.env[envMap[key]];

        // Special handling for array types from Env
        if (key === 'users' && envValue) {
            try {
                return JSON.parse(envValue);
            } catch (e) {
                return envValue.split(',');
            }
        }

        if (envValue === "undefined" || envValue === "null") return null;
        return envValue;
    }
};
