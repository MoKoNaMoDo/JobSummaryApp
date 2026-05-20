export function errMsg(error: unknown): string {
    return error instanceof Error ? error.message : 'Internal Server Error';
}
