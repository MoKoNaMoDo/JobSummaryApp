"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.login = exports.getConfig = void 0;
const configService_1 = require("../services/configService");
const getConfig = async (req, res) => {
    try {
        const config = configService_1.ConfigService.getConfig();
        const maskedConfig = {
            ...config,
            geminiApiKey: config.geminiApiKey ? '********' : '',
            serviceAccountJson: config.serviceAccountJson ? '********' : '',
            users: config.users || [] // Ensure users array is returned
        };
        res.json({ status: 'success', data: maskedConfig });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to retrieve config' });
    }
};
exports.getConfig = getConfig;
const login = async (req, res) => {
    try {
        const { password } = req.body;
        const storedPassword = configService_1.ConfigService.get('systemPassword') || '123456';
        if (password === storedPassword) {
            res.status(200).json({ status: 'success', message: 'Authenticated', token: 'simple-session-token' });
        }
        else {
            res.status(401).json({ status: 'error', message: 'Invalid password' });
        }
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.login = login;
const updateConfig = async (req, res) => {
    try {
        const newConfig = req.body;
        const currentConfig = configService_1.ConfigService.getConfig();
        // Merge logic: If value is masked (******), keep the old one.
        const mergedConfig = {
            ...currentConfig,
            ...newConfig,
            geminiApiKey: (newConfig.geminiApiKey && newConfig.geminiApiKey !== '********')
                ? newConfig.geminiApiKey
                : currentConfig.geminiApiKey,
            serviceAccountJson: (newConfig.serviceAccountJson && newConfig.serviceAccountJson !== '********')
                ? newConfig.serviceAccountJson
                : currentConfig.serviceAccountJson,
        };
        const success = configService_1.ConfigService.saveConfig(mergedConfig);
        if (success) {
            res.json({ status: 'success', message: 'Configuration updated successfully' });
        }
        else {
            res.status(500).json({ status: 'error', message: 'Failed to save configuration' });
        }
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update config' });
    }
};
exports.updateConfig = updateConfig;
