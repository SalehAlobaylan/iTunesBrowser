export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export type ServiceName = 'cms' | 'iam' | 'aggregation' | 'enrichment' | 'platform';

export interface DependencyHealth {
    name: string;
    status: ServiceStatus;
    detail?: string;
}

export interface QueueDepth {
    queue: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

export interface ModelLoad {
    name: string;
    loaded: boolean;
    detail?: string;
}

export interface ServiceHealth {
    name: ServiceName;
    displayName: string;
    endpointUrl: string;
    status: ServiceStatus;
    latencyMs: number | null;
    httpStatus: number | null;
    version?: string;
    deps: DependencyHealth[];
    queues?: QueueDepth[];
    models?: ModelLoad[];
    rawError?: string;
    raw?: unknown;
}

export interface EnvAuditEntry {
    key: string;
    present: boolean;
}

export type IssueSeverity = 'critical' | 'warning';

export interface SystemIssue {
    severity: IssueSeverity;
    service?: ServiceName;
    message: string;
}

export interface SystemHealthSnapshot {
    timestamp: string;
    overall: ServiceStatus;
    services: ServiceHealth[];
    envAudit: EnvAuditEntry[];
    issues: SystemIssue[];
}
