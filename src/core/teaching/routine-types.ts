export type CompilerNote = { kind: "example_only" | "info"; message: string };

export type RoutineStep =
  | { id: string; kind: "collect_evidence"; forEach: ["candidate", "criterion"]; completion: "evidence_exists_for_every_candidate_criterion_pair" }
  | { id: string; kind: "score"; forEach: ["candidate", "criterion"]; completion: "score_exists_for_every_candidate_criterion_pair" }
  | { id: string; kind: "check_uncertainty"; optional: true }
  | { id: string; kind: "approval"; requiredActor: "human"; before: "recommend" }
  | { id: string; kind: "recommend"; completion: "recommendation_exists" };

// The single routine representation specified in docs/ARCHITECTURE.md.
export type Routine = {
  schemaVersion: 1;
  id: string;
  name: string;
  domain: "vendor_evaluation";
  sourceSessionId: string;
  createdAt: string;
  inputs: [
    { key: "budget"; type: "money"; required: true },
    { key: "candidates"; type: "candidate_list"; minItems: 2; maxItems: 4; required: true },
  ];
  policies: {
    criteria: Array<{
      routineCriterionId: string;
      name: string;
      description?: string;
      priority: number;
      required: boolean;
    }>;
    approval: { requiredBeforeRecommendation: boolean };
  };
  steps: RoutineStep[];
  compilerNotes: CompilerNote[];
};
