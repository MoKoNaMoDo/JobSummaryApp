import { Request, Response } from 'express';
import { ConfigService, AppConfig } from '../services/configService';

export const getConfig = async (req: Request, res: Response) => {
    try {
        const config = ConfigService.getConfig();
        const maskedConfig = {
            ...config,
            geminiApiKey: config.geminiApiKey ? '********' : '',
            serviceAccountJson: config.serviceAccountJson ? '********' : '',
            users: config.users || [] // Ensure users array is returned
        };
        res.json({ status: 'success', data: maskedConfig });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to retrieve config' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { password } = req.body;
        const storedPassword = ConfigService.get('systemPassword') || '123456';

        if (password === storedPassword) {
            res.status(200).json({ status: 'success', message: 'Authenticated', token: 'simple-session-token' });
        } else {
            res.status(401).json({ status: 'error', message: 'Invalid password' });
        }
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const newConfig = req.body as AppConfig;
        const currentConfig = ConfigService.getConfig();

        // Merge logic: If value is masked (******), keep the old one.
        const mergedConfig: AppConfig = {
            ...currentConfig,
            ...newConfig,
            geminiApiKey: (newConfig.geminiApiKey && newConfig.geminiApiKey !== '********')
                ? newConfig.geminiApiKey
                : currentConfig.geminiApiKey,
            serviceAccountJson: (newConfig.serviceAccountJson && newConfig.serviceAccountJson !== '********')
                ? newConfig.serviceAccountJson
                : currentConfig.serviceAccountJson,
        };

        const success = await ConfigService.saveConfig(mergedConfig);

        if (success) {
            res.json({ status: 'success', message: 'Configuration updated successfully' });
        } else {
            res.status(500).json({ status: 'error', message: 'Failed to save configuration' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update config' });
    }
};
