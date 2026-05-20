import { GoogleService } from './src/services/googleService';
import { ConfigService } from './src/services/configService';

async function runTest() {
    try {
        console.log("=== STARTING LIVE DRIVE TEST ===");

        // Force Config to the new folder just in case
        const currentConfig = ConfigService.getConfig();
        currentConfig.googleDriveFolderIdJobs = "1BTlI-ZgmsM2ekMkXHKgZfb4aBs2I-5P_";
        ConfigService.saveConfig(currentConfig);

        console.log("Forced Job Folder ID in Config to:", ConfigService.get('googleDriveFolderIdJobs'));

        const dummyFile: any = {
            mimetype: 'image/jpeg',
            buffer: Buffer.from('test image content 123', 'utf-8')
        };

        const result = await GoogleService.uploadSlip(dummyFile, "PermissionTest", new Date().toISOString(), "Jobs");
        console.log("=== TEST FINISHED ===");
        console.log("Result URL:", result);

    } catch (e) {
        console.error("=== TEST ENCOUNTERED EXCEPTION ===");
        console.error(e);
    }
}

runTest();
