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

function getConfigValue(key: 'users'): string[] | undefined;
function getConfigValue(key: Exclude<keyof AppConfig, 'users'>): string | null | undefined;
function getConfigValue(key: keyof AppConfig): string | string[] | null | undefined;
function getConfigValue(key: keyof AppConfig): string | string[] | null | undefined {
    // Priority: configCache (Settings page / Sheets) → env vars (.env.local)
    // This lets users override keys from the Settings UI without touching .env files.
    const envMap: Record<keyof AppConfig, string> = {
        geminiApiKey: 'GEMINI_API_KEY',
        googleSheetId: 'GOOGLE_SHEET_ID',
        googleSheetIdJobs: 'GOOGLE_SHEET_ID_JOBS',
        googleDriveFolderId: 'GOOGLE_DRIVE_FOLDER_ID',
        googleDriveFolderIdJobs: 'GOOGLE_DRIVE_FOLDER_ID_JOBS',
        googleDocTemplateId: 'GOOGLE_DOC_TEMPLATE_ID',
        serviceAccountJson: 'GOOGLE_APPLICATION_CREDENTIALS_JSON',
        systemPassword: 'SYSTEM_PASSWORD',
        users: 'SYSTEM_USERS',
        googleAppsScriptUrl: 'GOOGLE_SCRIPT_URL',
        groqApiKey: 'GROQ_API_KEY',
    };

    // Sentinel/placeholder values that should be treated as "not set"
    const SENTINELS = new Set(['MISSING', 'PRESENT', 'undefined', 'null', '********', '••••••••••••••••']);

    // 1. configCache (from Settings page saved to Sheets, or loaded at startup)
    const cachedVal = configCache[key];
    if (cachedVal !== undefined && cachedVal !== null && cachedVal !== '') {
        // Reject known sentinel strings so they fall through to env var fallback
        if (typeof cachedVal === 'string' && SENTINELS.has(cachedVal.trim())) {
            // Remove the bad value so it doesn't block env fallback on next call
            delete configCache[key];
        } else {
            return cachedVal;
        }
    }

    // 2. env var fallback
    const envValue = process.env[envMap[key]]
        // Extra aliases for common naming variations
        ?? (key === 'googleAppsScriptUrl' ? (process.env.GOOGLE_APPS_SCRIPT_URL ?? process.env.GOOGLE_SCRIPT_URL) : undefined)
        ?? (key === 'googleSheetIdJobs' ? process.env.GOOGLE_SHEET_ID : undefined)
        ?? (key === 'googleDriveFolderIdJobs' ? process.env.GOOGLE_DRIVE_FOLDER_ID : undefined);

    if (key === 'users' && envValue) {
        try { return JSON.parse(envValue); } catch { return envValue.split(','); }
    }
    if (envValue === 'undefined' || envValue === 'null') return null;
    return envValue;
}

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

            // Sentinel/placeholder values that should be treated as "not set"
            const SENTINELS = new Set(['MISSING', 'PRESENT', 'undefined', 'null', '********', '••••••••••••••••']);

            // Mapped from Key-Value rows (skip header)
            const loadedConfig: Record<string, unknown> = {};
            rows.slice(1).forEach(row => {
                const [key, value] = row;
                if (key && value !== undefined && value !== null && value !== '') {
                    // Skip sentinel placeholder values left over from old API versions
                    if (typeof value === 'string' && SENTINELS.has(value.trim())) return;
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

            configCache = loadedConfig as AppConfig;
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

            // Never persist sentinel/placeholder values to Sheets
            const SENTINELS = new Set(['MISSING', 'PRESENT', 'undefined', 'null', '********', '••••••••••••••••']);

            const header = ['key', 'value'];
            const rows = [
                header,
                ...Object.entries(configCache)
                    .filter(([, v]) => {
                        if (v === undefined || v === null || v === '') return false;
                        if (typeof v === 'string' && SENTINELS.has(v.trim())) return false;
                        return true;
                    })
                    .map(([k, v]) => [
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

    get: getConfigValue,
};
