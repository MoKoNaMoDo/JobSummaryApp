import axios from 'axios';
import { ConfigService } from '../configService';

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZK2kRgPLXTb0LPn7Lsv2vfbfGeN2gPs5ZAfkAE5fbCr7Erij57HgqGWnqbAsK3VObYg/exec';

export async function uploadSlip(file: Express.Multer.File, contextName: string, date: string, prefix: string = 'JobSummary'): Promise<string> {
    try {
        let folderId = prefix === 'Jobs'
            ? ConfigService.get('googleDriveFolderIdJobs')
            : ConfigService.get('googleDriveFolderId');

        if (!folderId) {
            folderId = ConfigService.get('googleDriveFolderId');
        }

        const proxyUrl = ConfigService.get('googleAppsScriptUrl') || DEFAULT_APPS_SCRIPT_URL;

        if (folderId && proxyUrl) {
            const payload = {
                base64: file.buffer.toString('base64'),
                fileName: `${date || new Date().toISOString().split('T')[0]}_${contextName || 'Job'}_${Date.now()}.jpg`,
                mimeType: file.mimetype,
                folderId,
            };

            const response = await axios.post(proxyUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.data && response.data.status === 'success') {
                return response.data.url;
            }

            throw new Error(response.data?.message || 'Proxy returned an error');
        }

        throw new Error('No Upload Method Configured (Drive Folder ID or Proxy URL)');
    } catch (error: any) {
        console.error('Error uploading via Proxy:', error.message);
        return 'UPLOAD_FAILED';
    }
}

