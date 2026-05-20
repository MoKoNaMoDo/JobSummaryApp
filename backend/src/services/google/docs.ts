import { getDocsClient, getDriveClient } from '../../config/google';
import { ConfigService } from '../configService';
import type { ReimbursementDocInput } from './types';

export async function generateReimbursementDoc(data: ReimbursementDocInput) {
    try {
        const templateId = ConfigService.get('googleDocTemplateId');
        if (!templateId) {
            console.warn('GOOGLE_DOC_TEMPLATE_ID not set, skipping doc generation.');
            return null;
        }

        const drive = getDriveClient();
        getDocsClient();

        const newFileResponse = await drive.files.copy({
            fileId: templateId,
            requestBody: {
                name: `WorkLog_${data.date}_${data.payer}`,
            },
        });

        const newDocId = newFileResponse.data.id;
        if (!newDocId) throw new Error('Failed to copy template');

        return null;
    } catch (error) {
        console.error('Error generating doc:', error);
        return null;
    }
}

