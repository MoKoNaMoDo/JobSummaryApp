"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG_PATH = path_1.default.join(__dirname, '../../data/config.json');
// Ensure data directory exists (Likely fails on Vercel/Read-only FS, but okay for local)
try {
    const dir = path_1.default.dirname(CONFIG_PATH);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
catch (err) {
    console.warn("Could not create config directory (likely read-only env):", err);
}
exports.ConfigService = {
    getConfig: () => {
        try {
            if (fs_1.default.existsSync(CONFIG_PATH)) {
                const raw = fs_1.default.readFileSync(CONFIG_PATH, 'utf-8');
                return JSON.parse(raw);
            }
        }
        catch (error) {
            console.error("Error reading config:", error);
        }
        return {};
    },
    saveConfig: (newConfig) => {
        try {
            fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
            return true;
        }
        catch (error) {
            console.error("Error saving config:", error);
            return false;
        }
    },
    get: (key) => {
        const config = exports.ConfigService.getConfig();
        // Priority: Config File > Environment Variable
        if (config[key])
            return config[key];
        // Map config keys to Env vars for fallback
        const envMap = {
            geminiApiKey: 'GEMINI_API_KEY',
            googleSheetId: 'GOOGLE_SHEET_ID',
            googleDriveFolderId: 'GOOGLE_DRIVE_FOLDER_ID',
            googleDocTemplateId: 'GOOGLE_DOC_TEMPLATE_ID',
            serviceAccountJson: 'GOOGLE_APPLICATION_CREDENTIALS_JSON',
            systemPassword: 'SYSTEM_PASSWORD',
            users: 'SYSTEM_USERS' // JSON string of users e.g. ["Alice", "Bob"]
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
