import {
  SubjectResult,
  ResultSummary,
  summariseSubjects,
  calculateGradeFromPercentage,
  isSubjectFail,
  formatPercentage,
  slugifyClass,
  normalizeResultData,
  inferSubjectsFromRecord,
} from "@shared/results";

export type { SubjectResult, ResultSummary };
export {
  summariseSubjects,
  calculateGradeFromPercentage,
  isSubjectFail,
  formatPercentage,
  slugifyClass,
  normalizeResultData,
  inferSubjectsFromRecord,
};

const CLASS_DEFINITIONS = [
  "Class 10 (SSC)",
  "Class 9",
  "Class 8",
  "Intermediate I",
  "Intermediate II",
] as const;

export const CLASS_OPTIONS = CLASS_DEFINITIONS.map((label) => ({
  label,
  value: slugifyClass(label),
}));
