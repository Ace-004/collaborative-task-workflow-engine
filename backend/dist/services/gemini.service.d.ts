interface DecodedTask {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    estimated_hours: number;
}
export declare const decomposeRequirementWithAI: (requirements: string) => Promise<DecodedTask[]>;
export {};
//# sourceMappingURL=gemini.service.d.ts.map