import app from './app';
import { ConfigService } from './services/configService';

const PORT = process.env.PORT || 5000;

async function startServer() {
    let server: any;
    const shutdown = () => {
        console.log("Shutting down server...");
        if (server) {
            server.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    };

    try {
        console.log("Starting server initialization...");
        // 1. Pre-load configuration from Google Sheets
        await ConfigService.load();

        // 2. Start Listening
        server = app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log("Ready for requests...");
        });

        // Event loop keep-alive to prevent premature exit
        const keepAlive = setInterval(() => { }, 1000 * 60 * 60);

        process.on('SIGINT', () => {
            clearInterval(keepAlive);
            shutdown();
        });
        process.on('SIGTERM', () => {
            clearInterval(keepAlive);
            shutdown();
        });

    } catch (error) {
        console.error("CRITICAL: Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
