export const ADMISSION_STATUSES = ["new", "counselled", "willing_to_join", "joined", "no_admission"] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export type AdmissionRecord = {
  id: number;
  studentName: string;
  parentName: string;
  classApplyingFor: string;
  academicYear?: string | null;
  dob?: string | null;
  phone: string;
  email: string;
  address: string;
  previousSchool?: string | null;
  message?: string | null;
  status: AdmissionStatus;
  expectedJoinDate?: string | null;
  statusUpdatedAt?: string | null;
  submittedAt?: string | null;
  source?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

export const ADMISSION_STATUS_META: Record<
  AdmissionStatus,
  { label: string; badgeClass: string; accentClass: string }
> = {
  new: {
    label: "New",
    badgeClass: "bg-blue-100 text-blue-800",
    accentClass: "text-blue-600",
  },
  counselled: {
    label: "Counselled",
    badgeClass: "bg-amber-100 text-amber-800",
    accentClass: "text-amber-600",
  },
  willing_to_join: {
    label: "Willing to Join",
    badgeClass: "bg-emerald-100 text-emerald-800",
    accentClass: "text-emerald-600",
  },
  joined: {
    label: "Joined",
    badgeClass: "bg-green-200 text-green-900",
    accentClass: "text-green-600",
  },
  no_admission: {
    label: "No Admission",
    badgeClass: "bg-red-100 text-red-700",
    accentClass: "text-red-600",
  },
};

export const STATUS_ACTIONS: Array<{ value: AdmissionStatus; label: string; description: string }> = [
  { value: "new", label: "New", description: "Mark enquiry as new/untouched" },
  { value: "counselled", label: "Counselled", description: "Family counselled by staff" },
  { value: "willing_to_join", label: "Willing to Join", description: "Family confirmed interest" },
  { value: "joined", label: "Joined", description: "Student completed admission" },
  { value: "no_admission", label: "No Admission", description: "Not proceeding / lost lead" },
];
