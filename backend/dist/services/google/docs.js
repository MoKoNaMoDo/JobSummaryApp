"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReimbursementDoc = generateReimbursementDoc;
const google_1 = require("../../config/google");
const configService_1 = require("../configService");
async function generateReimbursementDoc(data) {
    try {
        const templateId = configService_1.ConfigService.get('googleDocTemplateId');
        if (!templateId) {
            console.warn('GOOGLE_DOC_TEMPLATE_ID not set, skipping doc generation.');
            return null;
        }
        const drive = (0, google_1.getDriveClient)();
        (0, google_1.getDocsClient)();
        const newFileResponse = await drive.files.copy({
            fileId: templateId,
            requestBody: {
                name: `WorkLog_${data.date}_${data.payer}`,
            },
        });
        const newDocId = newFileResponse.data.id;
        if (!newDocId)
            throw new Error('Failed to copy template');
        return null;
    }
    catch (error) {
        console.error('Error generating doc:', error);
        return null;
    }
}
