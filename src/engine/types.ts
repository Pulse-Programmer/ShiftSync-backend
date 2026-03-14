export interface AssignmentContext {
  userId: string;
  shiftId: string;
  shift: {
    id: string;
    locationId: string;
    startTime: Date;
    endTime: Date;
    requiredSkillId: string | null;
    scheduleId: string;
  };
  location: {
    id: string;
    timezone: string;
  };
  // Exclude this assignment from overlap checks (for swap validation)
  excludeAssignmentId?: string;
}

export interface ConstraintResult {
  constraint: string;
  passed: boolean;
  severity: 'error' | 'warning';
  message: string;
  details: Record<string, any>;
  overridable?: boolean;
  suggestions?: Suggestion[];
}

export interface ValidationResult {
  valid: boolean;
  results: ConstraintResult[];
  suggestions?: Suggestion[];
}

export interface Suggestion {
  userId: string;
  userName: string;
  reason: string;
}

export interface Override {
  constraint: string;
  reason: string;
}

export type ConstraintFn = (context: AssignmentContext) => Promise<ConstraintResult>;
