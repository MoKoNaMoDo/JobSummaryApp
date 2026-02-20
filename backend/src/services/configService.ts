import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '../../data/config.json');

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
}

// Ensure data directory exists (Likely fails on Vercel/Read-only FS, but okay for local)
try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
} catch (err) {
    console.warn("Could not create config directory (likely read-only env):", err);
}

export const ConfigService = {
    getConfig: (): AppConfig => {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
                return JSON.parse(raw);
            }
        } catch (error) {
            console.error("Error reading config:", error);
        }
        return {};
    },

    saveConfig: (newConfig: AppConfig): boolean => {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
            return true;
        } catch (error) {
            console.error("Error saving config:", error);
            return false;
        }
    },

    get: (key: keyof AppConfig): any => {
        const config = ConfigService.getConfig();
        // Priority: Config File > Environment Variable
        if (config[key]) return config[key];

        // Map config keys to Env vars for fallback
        const envMap: Record<keyof AppConfig, string> = {
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
            } catch (e) {
                return envValue.split(','); // Fallback: comma separated
            }
        }

        return envValue;
    }
};
