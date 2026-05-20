import { ConfigService } from "@/lib/services/configService";

export function errMsg(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
}

let configLoaded = false;

export async function ensureConfig(): Promise<void> {
    if (!configLoaded) {
        await ConfigService.load();
        configLoaded = true;
    }
}
