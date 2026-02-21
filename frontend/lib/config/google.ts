import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';
import { ConfigService } from '../services/configService';

dotenv.config();

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
];

const getAuth = () => {
    // 1. Try ConfigService (Dynamic JSON Content)
    const jsonContent = ConfigService.get('serviceAccountJson');
    if (jsonContent) {
        try {
            const credentials = JSON.parse(jsonContent);
            return new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });
        } catch (e) {
            console.error("Invalid Service Account JSON in config", e);
        }
    }

    // 2. Fallback to Environment Variable or Default File Path
    // 2. Fallback to Environment Variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: SCOPES,
        });
    }

    // 3. Last Resort: Check local file (Only if exists, to avoid crash)
    const localKeyPath = path.join(__dirname, '../../service-account.json');
    try {
        // Using fs inside try-catch just to be safe, though GoogleAuth might handle it.
        // Better to return a dummy auth or throw a clear error than let GoogleAuth crash on file read
        return new google.auth.GoogleAuth({
            keyFile: localKeyPath,
            scopes: SCOPES,
        });
    } catch (e) {
        console.error("No valid credentials found.");
        throw new Error("Google Config Error: No credentials provided.");
    }
};

export const getDriveClient = () => google.drive({ version: 'v3', auth: getAuth() });
export const getSheetsClient = () => google.sheets({ version: 'v4', auth: getAuth() });
export const getDocsClient = () => google.docs({ version: 'v1', auth: getAuth() });

