// Approved native tool metadata and schemas from docs/WEBMCP.md.
import type { NativeTool } from "../types/webmcp";

export const toolContracts = [
  {
    "name": "get_workspace",
    "title": "Get workspace",
    "description": "Get the current ONCE vendor-evaluation workspace, including budget, candidates, criteria, evidence, scores, uncertainty, recommendation, phase, and replay status. Call this when you need the current shared state before deciding what to change.",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "additionalProperties": false
    },
    "annotations": {
      "readOnlyHint": true
    }
  },
  {
    "name": "add_candidates",
    "title": "Add candidates",
    "description": "Add one or more vendor candidates to the current collaboration workspace. Candidate identities become variable inputs when a routine is taught. Do not use this tool to change candidates after replay has started.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "candidates": {
          "type": "array",
          "minItems": 1,
          "maxItems": 4,
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "minLength": 1
              }
            },
            "required": [
              "name"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "candidates"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "get_vendor_dossier",
    "title": "Get vendor dossier",
    "description": "Read ONCE's deterministic demo dossier facts for one or more named vendors. Use these first-party facts as evidence inputs for the competition demo. Do not claim the dossier is live web research.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "vendorNames": {
          "type": "array",
          "minItems": 1,
          "maxItems": 4,
          "items": {
            "type": "string",
            "minLength": 1
          }
        }
      },
      "required": [
        "vendorNames"
      ],
      "additionalProperties": false
    },
    "annotations": {
      "readOnlyHint": true,
      "untrustedContentHint": false
    }
  },
  {
    "name": "get_replay_plan",
    "title": "Get replay plan",
    "description": "Get the active learned routine, its new input bindings, completed and pending steps, approval status, and the next allowed semantic work. Call this when the workspace is in replay mode.",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "additionalProperties": false
    },
    "annotations": {
      "readOnlyHint": true
    }
  },
  {
    "name": "set_budget",
    "title": "Set budget",
    "description": "Set the evaluation budget in the current collaboration workspace. In taught routines, budget becomes a variable input rather than a fixed policy. This action is not allowed after an active replay has started.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "amount": {
          "type": "number",
          "minimum": 0
        },
        "currency": {
          "type": "string",
          "enum": [
            "USD"
          ]
        }
      },
      "required": [
        "amount",
        "currency"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "add_criteria",
    "title": "Add criteria",
    "description": "Add one or more evaluation criteria with priority and required status. Criteria are treated as reusable evaluation policy when a routine is taught.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "criteria": {
          "type": "array",
          "minItems": 1,
          "maxItems": 6,
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "minLength": 1
              },
              "description": {
                "type": "string"
              },
              "priority": {
                "type": "integer",
                "minimum": 1
              },
              "required": {
                "type": "boolean"
              }
            },
            "required": [
              "name",
              "priority",
              "required"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "criteria"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "attach_evidence",
    "title": "Attach evidence",
    "description": "Attach evidence summaries to candidate/criterion pairs using source references from the ONCE demo dossiers. During replay, evidence is required for every candidate/criterion pair before scoring can complete. Evidence text is execution output and is not copied literally into a learned routine.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "minItems": 1,
          "maxItems": 12,
          "items": {
            "type": "object",
            "properties": {
              "candidateId": {
                "type": "string",
                "minLength": 1
              },
              "criterionId": {
                "type": "string",
                "minLength": 1
              },
              "summary": {
                "type": "string",
                "minLength": 1
              },
              "sourceRef": {
                "type": "string",
                "minLength": 1
              },
              "confidence": {
                "type": "string",
                "enum": [
                  "high",
                  "medium",
                  "low"
                ]
              }
            },
            "required": [
              "candidateId",
              "criterionId",
              "summary",
              "sourceRef",
              "confidence"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "set_scores",
    "title": "Set scores",
    "description": "Score one or more candidate/criterion pairs from 1 to 5 with a rationale. Use 1=does not meet, 2=materially below, 3=meets, 4=strong, 5=excellent. During replay, use current evidence and routine policy. A replay score requires evidence for the same pair. Score values are generated per run and are not copied from the taught session.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "minItems": 1,
          "maxItems": 12,
          "items": {
            "type": "object",
            "properties": {
              "candidateId": {
                "type": "string",
                "minLength": 1
              },
              "criterionId": {
                "type": "string",
                "minLength": 1
              },
              "score": {
                "type": "integer",
                "minimum": 1,
                "maximum": 5
              },
              "rationale": {
                "type": "string",
                "minLength": 1
              }
            },
            "required": [
              "candidateId",
              "criterionId",
              "score",
              "rationale"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "flag_uncertainty",
    "title": "Flag uncertainty",
    "description": "Record an uncertainty that should remain visible to the human. Use this when the available evidence does not justify a confident conclusion. The literal uncertainty note is not copied into a routine.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "candidateId": {
          "type": "string",
          "minLength": 1
        },
        "criterionId": {
          "type": "string",
          "minLength": 1
        },
        "note": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": [
        "note"
      ],
      "additionalProperties": false
    }
  },
  {
    "name": "set_recommendation",
    "title": "Set recommendation",
    "description": "Set the current final recommended candidate and rationale. In replay mode, this tool is blocked until every required pre-recommendation step is complete and any required human approval has been explicitly granted.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "candidateId": {
          "type": "string",
          "minLength": 1
        },
        "rationale": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": [
        "candidateId",
        "rationale"
      ],
      "additionalProperties": false
    }
  }
] satisfies Omit<NativeTool, "execute">[];
