export declare const redis: any;
export declare const cacheSet: (key: string, data: any, ttlSeconds?: number) => Promise<void>;
export declare const cacheGet: <T>(key: string) => Promise<T | null>;
export declare const cacheDelete: (key: string) => Promise<void>;
//# sourceMappingURL=redis.service.d.ts.map