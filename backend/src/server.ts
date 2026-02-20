import app from './app';
import { ConfigService } from './services/configService';

const PORT = process.env.PORT || 5000;

async function startServer() {
    // 1. Pre-load configuration from Google Sheets
    await ConfigService.load();

    // 2. Start Listening
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
