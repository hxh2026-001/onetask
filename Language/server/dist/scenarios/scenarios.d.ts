export interface Scenario {
    id: string;
    name: string;
    description: string;
    code: string;
    expectedErrors: string[];
    highlights: string[];
}
export declare const SCENARIOS: Record<string, Scenario>;
export declare function getScenario(id: string): Scenario | null;
export declare function getAllScenarios(): Scenario[];
//# sourceMappingURL=scenarios.d.ts.map