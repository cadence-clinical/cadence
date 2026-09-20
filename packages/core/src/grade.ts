/**
 * Component grades. PROVISIONAL: the grading matrix has not been designed yet, so the level
 * names and their criteria will change. What is settled (docs/decisions/0004-component-grading.md):
 *
 * - A grade above "tested" is a claim about one specific version. It names that version and
 *   points at the evidence. A visual or behavioural change drops the component back to "tested".
 * - A copy installed from the registry and then edited carries no grade.
 */

/** The grade levels, lowest first. Provisional until the grading matrix is agreed. */
export const GRADE_LEVELS = ["draft", "tested", "clinician-verified", "in-production"] as const;

/** How far a component has been verified. */
export type GradeLevel = (typeof GRADE_LEVELS)[number];

/** The grade a component declares in its package's registry.json. */
export interface ComponentGrade {
  level: GradeLevel;
  /** The package version the grade was assessed against. Required above "tested". */
  version?: string;
  /** Repo-relative paths to the review records backing the grade. Required above "tested". */
  evidence?: readonly string[];
}

/** Negative when a ranks below b, zero when equal, positive when above. */
export function compareGrades(a: GradeLevel, b: GradeLevel): number {
  return GRADE_LEVELS.indexOf(a) - GRADE_LEVELS.indexOf(b);
}

/** Returns the problems with a grade declaration. An empty array means it is valid. */
export function validateGrade(grade: ComponentGrade): string[] {
  const problems: string[] = [];

  if (!GRADE_LEVELS.includes(grade.level)) {
    problems.push(`Unknown grade level "${grade.level}".`);
    return problems;
  }

  if (compareGrades(grade.level, "tested") > 0) {
    if (!grade.version) {
      problems.push(`Grade "${grade.level}" must name the version it was assessed against.`);
    }
    if (!grade.evidence || grade.evidence.length === 0) {
      problems.push(`Grade "${grade.level}" must reference at least one evidence record.`);
    }
  }

  return problems;
}
