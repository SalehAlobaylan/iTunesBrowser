import { cmsClient } from '@/lib/api/client';

export interface AuditLogEntry {
    action: string;
    target_service: string;
    target_resource?: string;
    status: 'success' | 'failure';
    error_message?: string;
    payload?: Record<string, unknown>;
}

export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
        await cmsClient.post('/admin/audit', entry);
    } catch {
        // Audit logging is best-effort — never block or surface failures to the user.
        // The action itself already toasted its own result.
    }
}
