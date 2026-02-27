export type SubjectResult = {
  name: string;
  maxMarks: number;
  marksObtained: number;
  grade?: string | null;
  status?: string | null;
};

export type ResultSummary = {
  subjects: SubjectResult[];
  totalMax: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  overallStatus: "Pass" | "Fail";
};

type NormalizedEntry = {
  originalKey: string;
  normalizedKey: string;
  value: any;
};

const DEFAULT_MAX_MARKS = 100;

const SUBJECT_JSON_KEYS = ["subjects_json", "subjectsJson", "Subjects JSON"];

const CORE_METADATA_KEYS = new Set(
  [
    "roll no",
    "roll number",
    "rollno",
    "roll",
    "hall ticket",
    "hallticket",
    "hall ticket no",
    "hallticket no",
    "hall ticket number",
    "student",
    "student name",
    "studentname",
    "name",
    "student id",
    "admission no",
    "exam",
    "exam name",
    "exam title",
    "examname",
    "examyear",
    "exam year",
    "year",
    "academic year",
    "session",
    "class",
    "class name",
    "class standard",
    "class section",
    "classsection",
    "classroom",
    "class grade",
    "grade",
    "overall grade",
    "grades",
    "course",
    "stream",
    "board",
    "section",
    "sec",
    "dob",
    "date of birth",
    "birth date",
    "status",
    "result",
    "result status",
    "resultstatus",
    "remarks",
    "comments",
    "summary",
    "total",
    "total marks",
    "marks",
    "marks obtained",
    "total obtained",
    "percentage",
    "overall percentage",
    "max marks",
    "maximum marks",
    "out of",
  ].map(normalizeKey),
);

const SUBJECT_COMPANION_SUFFIXES = {
  max: [" max", " max marks", " maximum", " maximum marks", " out of"],
  grade: [" grade", " grading"],
  status: [" status", " result"],
};

export function calculateGradeFromPercentage(percentage: number) {
  if (!Number.isFinite(percentage)) return "N/A";
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 40) return "D";
  return "Fail";
}

export function isSubjectFail(subject: SubjectResult) {
  if (!subject) return false;
  const status = subject.status?.toLowerCase();
  if (status && (status.includes("fail") || status.includes("absent"))) {
    return true;
  }
  if (subject.maxMarks <= 0) return false;
  const percentage = (subject.marksObtained / subject.maxMarks) * 100;
  return percentage < 40;
}

export function summariseSubjects(subjects: SubjectResult[]): ResultSummary {
  const safeSubjects = subjects
    .filter((sub) => sub && sub.name)
    .map((subject) => ({
      ...subject,
      maxMarks: Number.isFinite(subject.maxMarks) && subject.maxMarks > 0 ? subject.maxMarks : DEFAULT_MAX_MARKS,
      marksObtained: Number.isFinite(subject.marksObtained) ? subject.marksObtained : 0,
      grade: subject.grade,
      status: subject.status,
    }));

  const totalMax = safeSubjects.reduce((acc, subject) => acc + (subject.maxMarks || 0), 0);
  const totalObtained = safeSubjects.reduce((acc, subject) => acc + (subject.marksObtained || 0), 0);
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const grade = calculateGradeFromPercentage(percentage);
  const hasFailure = safeSubjects.some(isSubjectFail);
  const overallStatus = hasFailure || percentage < 40 ? "Fail" : "Pass";

  return {
    subjects: safeSubjects.map((subject) => ({
      ...subject,
      grade: subject.grade || calculateGradeFromPercentage((subject.marksObtained / subject.maxMarks) * 100),
      status: subject.status || (isSubjectFail(subject) ? "Fail" : "Pass"),
    })),
    totalMax,
    totalObtained,
    percentage,
    grade,
    overallStatus,
  };
}

export function formatPercentage(value: number) {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}%`;
}

export function slugifyClass(value: unknown): string {
  const tokens = collectClassTokens(value);
  if (!tokens.length) return "";
  // Prefer numeric token first
  const digitToken = tokens.find((token) => /^\d+$/.test(token));
  if (digitToken) return digitToken;
  // Otherwise return the most descriptive token (longest)
  return tokens.sort((a, b) => b.length - a.length)[0];
}

export function collectClassTokens(value: unknown): string[] {
  if (!value && value !== 0) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const collapsed = lower.replace(/[^a-z0-9]/g, "");
  const digits = lower.replace(/[^0-9]/g, "");
  const noKeywords = lower
    .replace(/\b(class|std|standard|grade|ssc|cbse|intermediate|inter|year|classroom|section)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
  const words = lower.split(/\s+/).filter(Boolean);
  const unique = new Set([raw.trim(), lower, collapsed, digits, noKeywords, ...words].filter(Boolean));
  return Array.from(unique);
}

export function normalizeResultData({
  data,
  rawRow,
  fallbackClass,
  fallbackYear,
}: {
  data?: Record<string, any> | null;
  rawRow?: Record<string, any> | null;
  fallbackClass?: string;
  fallbackYear?: number;
} = {}): Record<string, any> {
  const base = { ...(isPlainObject(rawRow) ? rawRow : {}), ...(isPlainObject(data) ? data : {}) };

  const className =
    coalesce(
      base.className,
      base.class,
      base.Class,
      base["class name"],
      base["Class Name"],
      base.standard,
      base.Standard,
      base.grade,
      base.Grade,
      fallbackClass,
    ) || "";
  const examDescriptor = coalesce(
    base.examClass,
    base["exam class"],
    base.examName,
    base["exam name"],
    base.exam,
    base.Exam,
    base["exam title"],
    base["Exam Title"],
  );
  const resolvedClassName = className || (typeof examDescriptor === "string" ? titleCase(examDescriptor) : base.className);
  const slugSource =
    coalesce(
      base.classSlug,
      resolvedClassName,
      fallbackClass,
      base.class,
      base.Class,
      base["class name"],
      base["Class Name"],
      base["class level"],
      base["Class Level"],
      base.standard,
      base.Standard,
      base.grade,
      base.Grade,
      examDescriptor,
      base.course,
      base.Course,
      base.stream,
      base.Stream,
    ) || "";
  const resolvedClassSlug = slugSource ? slugifyClass(slugSource) : "";
  const section = coalesce(base.section, base.Section, base.classSection, base["class section"], base.sec, base.Sec);
  const dob = coalesce(base.dob, base.DOB, base["date of birth"], base["Date of Birth"], base.birthDate);
  const academicYear = coalesce(base.academicYear, base["academic year"], base.session, base.Session);
  const resultStatus = coalesce(base.resultStatus, base.status, base.Status);

  const subjects =
    Array.isArray(base.subjects) && base.subjects.length > 0
      ? sanitizeSubjects(base.subjects as SubjectResult[])
      : inferSubjectsFromRecord(base);

  const summary = summariseSubjects(subjects);

  const normalized = {
    ...base,
    className: resolvedClassName || base.className,
    classSlug: resolvedClassSlug || (typeof base.classSlug === "string" ? base.classSlug : ""),
    section: section ?? base.section,
    dob: dob ?? base.dob,
    academicYear: academicYear ?? deriveAcademicYear(base.year ?? base.Year ?? fallbackYear),
    resultStatus: resultStatus || summary.overallStatus,
    subjects: summary.subjects,
    totalMarks: base.totalMarks ?? summary.totalObtained,
    maxTotal: base.maxTotal ?? summary.totalMax,
    percentage: base.percentage ?? summary.percentage,
    computedGrade: base.computedGrade ?? summary.grade,
  };

  return normalized;
}

export function inferSubjectsFromRecord(record: Record<string, any>): SubjectResult[] {
  const normalizedEntries = Object.entries(record).map<NormalizedEntry>(([key, value]) => ({
    originalKey: key,
    normalizedKey: normalizeKey(key),
    value,
  }));

  const usedKeys = new Set<string>();
  const subjects: SubjectResult[] = [];

  // 1. Try explicit JSON columns
  for (const jsonKey of SUBJECT_JSON_KEYS) {
    const parsed = tryParseSubjects(record[jsonKey]);
    if (parsed.length) {
      return sanitizeSubjects(parsed);
    }
  }

  // 2. Subject 1 / Subject 2 style columns
  const grouped: Record<string, Partial<SubjectResult>> = {};
  normalizedEntries.forEach((entry) => {
    const match = entry.normalizedKey.match(/^subject\s*(\d+)?\s*(name|title|max|max marks|maximum|marks?|score|obtained|grade|status)$/);
    if (!match) return;
    const idx = match[1] || entry.normalizedKey;
    const key = idx.trim() || "0";
    if (!grouped[key]) grouped[key] = {};
    usedKeys.add(entry.originalKey);
    const field = match[2];
    if (field.includes("name") || field.includes("title")) {
      grouped[key].name = safeString(entry.value);
    } else if (field.includes("max")) {
      const parsed = toNumber(entry.value);
      if (parsed !== undefined) grouped[key].maxMarks = parsed;
    } else if (field.includes("grade")) {
      grouped[key].grade = safeString(entry.value);
    } else if (field.includes("status")) {
      grouped[key].status = safeString(entry.value);
    } else {
      const parsed = toNumber(entry.value);
      if (parsed !== undefined) grouped[key].marksObtained = parsed;
    }
  });

  Object.values(grouped).forEach((item) => {
    if (item.name && typeof item.marksObtained === "number") {
      subjects.push({
        name: titleCase(item.name),
        maxMarks: item.maxMarks ?? DEFAULT_MAX_MARKS,
        marksObtained: item.marksObtained,
        grade: item.grade,
        status: item.status,
      });
    }
  });

  if (subjects.length > 0) {
    return sanitizeSubjects(subjects);
  }

  // 3. Treat loose numeric columns as subjects
  normalizedEntries.forEach((entry) => {
    if (usedKeys.has(entry.originalKey)) return;
    if (!isValueScalar(entry.value)) return;
    if (CORE_METADATA_KEYS.has(entry.normalizedKey)) return;

    const marks = toNumber(entry.value);
    if (marks === undefined) return;

    const base = entry.normalizedKey
      .replace(/\bmarks?\b/g, "")
      .replace(/\bscore\b/g, "")
      .replace(/\bobtained\b/g, "")
      .replace(/\bpaper\b/g, "")
      .trim();

    const subjectName = titleCase(base || entry.originalKey);
    if (!subjectName) return;

    const companionMax = findCompanionValue(normalizedEntries, entry, SUBJECT_COMPANION_SUFFIXES.max);
    const companionGrade = findCompanionValue(normalizedEntries, entry, SUBJECT_COMPANION_SUFFIXES.grade);
    const companionStatus = findCompanionValue(normalizedEntries, entry, SUBJECT_COMPANION_SUFFIXES.status);

    if (companionMax?.key) usedKeys.add(companionMax.key);
    if (companionGrade?.key) usedKeys.add(companionGrade.key);
    if (companionStatus?.key) usedKeys.add(companionStatus.key);
    usedKeys.add(entry.originalKey);

    subjects.push({
      name: subjectName,
      maxMarks: companionMax?.value ?? DEFAULT_MAX_MARKS,
      marksObtained: marks,
      grade: companionGrade?.text,
      status: companionStatus?.text,
    });
  });

  return sanitizeSubjects(subjects);
}

function findCompanionValue(
  entries: NormalizedEntry[],
  target: NormalizedEntry,
  suffixes: string[],
) {
  const base = target.normalizedKey;
  for (const entry of entries) {
    if (entry === target) continue;
    for (const suffix of suffixes) {
      if (entry.normalizedKey === `${base}${suffix}` || entry.normalizedKey === `${base} ${suffix}`) {
        const numberValue = toNumber(entry.value);
        if (numberValue !== undefined) {
          return { key: entry.originalKey, value: numberValue };
        }
        const text = safeString(entry.value);
        if (text) {
          return { key: entry.originalKey, text };
        }
      }
    }
  }
  return undefined;
}

function sanitizeSubjects(subjects: SubjectResult[]) {
  return subjects
    .filter((subject) => subject && subject.name)
    .map((subject) => ({
      name: titleCase(subject.name),
      maxMarks:
        typeof subject.maxMarks === "number" && Number.isFinite(subject.maxMarks) && subject.maxMarks > 0
          ? subject.maxMarks
          : DEFAULT_MAX_MARKS,
      marksObtained:
        typeof subject.marksObtained === "number" && Number.isFinite(subject.marksObtained)
          ? subject.marksObtained
          : 0,
      grade: subject.grade ?? null,
      status: subject.status ?? null,
    }));
}

function tryParseSubjects(value: unknown): SubjectResult[] {
  if (!value) return [];
  try {
    if (typeof value === "string") {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as SubjectResult[];
    } else if (Array.isArray(value)) {
      return value as SubjectResult[];
    }
  } catch {
    return [];
  }
  return [];
}

function deriveAcademicYear(value: unknown): string | undefined {
  const yearNumber = toNumber(value);
  if (!yearNumber) return undefined;
  const start = yearNumber - 1;
  return `${start}-${yearNumber}`;
}

function coalesce<T>(...values: T[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function normalizeKey(key: string) {
  return key.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function titleCase(value?: string | null) {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function safeString(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.replace(/,/g, "");
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function isValueScalar(value: unknown) {
  return typeof value === "string" || typeof value === "number";
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
