import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSubmitAdmissionEnquiry } from "@/hooks/use-additional-content";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CLASS_OPTIONS } from "@/lib/results";
import { Loader2, CheckCircle2, Phone, Mail, MapPin, BookUser } from "lucide-react";
import { useState } from "react";
import { SCHOOL_PHONE_DISPLAY, SCHOOL_PHONE_TEL } from "@/lib/branding";

const enquirySchema = z.object({
  studentName: z.string().min(2, "Student name is required"),
  parentName: z.string().min(2, "Parent/guardian name is required"),
  classApplyingFor: z.string().min(1, "Select a class"),
  academicYear: z.string().min(4, "Academic year is required"),
  dob: z.string().min(1, "Date of birth is required"),
  phone: z.string().min(8, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  previousSchool: z.string().optional(),
  message: z.string().optional(),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

const DEFAULT_VALUES: EnquiryFormValues = {
  studentName: "",
  parentName: "",
  classApplyingFor: "",
  academicYear: "",
  dob: "",
  phone: "",
  email: "",
  address: "",
  previousSchool: "",
  message: "",
};

export default function Admissions() {
  const { toast } = useToast();
  const mutation = useSubmitAdmissionEnquiry();
  const [recentSubmission, setRecentSubmission] = useState<{ studentName: string; classApplyingFor: string } | null>(null);

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = async (values: EnquiryFormValues) => {
    try {
      await mutation.mutateAsync(values);
      setRecentSubmission({ studentName: values.studentName, classApplyingFor: values.classApplyingFor });
      toast({ title: "Enquiry submitted", description: "Our admissions counselor will contact you shortly." });
      form.reset(DEFAULT_VALUES);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to submit enquiry";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    }
  };

  const isSubmitting = mutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-10">
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Admissions 2026</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Secure a Seat at Montessori EM High School</h1>
          <p className="text-lg text-slate-600">
            Complete the enquiry form below and our admissions counsellors will guide you through campus tours, documentation,
            and joining formalities.
          </p>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 shadow-xl border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BookUser className="h-6 w-6 text-primary" />
                Admission Enquiry Form
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Fill in student details accurately. Fields marked * are mandatory.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Student Name" error={form.formState.errors.studentName?.message} required>
                  <Input placeholder="Student full name" {...form.register("studentName")} />
                </Field>
                <Field label="Parent / Guardian Name" error={form.formState.errors.parentName?.message} required>
                  <Input placeholder="Parent or guardian" {...form.register("parentName")} />
                </Field>
                <Field label="Class Applying For" error={form.formState.errors.classApplyingFor?.message} required>
                  <Select value={form.watch("classApplyingFor")} onValueChange={(value) => form.setValue("classApplyingFor", value, { shouldValidate: true })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map((option) => (
                        <SelectItem key={option.label} value={option.label}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Academic Year" error={form.formState.errors.academicYear?.message} required>
                  <Input placeholder="2025-26" {...form.register("academicYear")} />
                </Field>
                <Field label="Date of Birth" error={form.formState.errors.dob?.message} required>
                  <Input type="date" {...form.register("dob")} />
                </Field>
                <Field label="Phone Number" error={form.formState.errors.phone?.message} required>
                  <Input type="tel" placeholder="088132 81255" {...form.register("phone")} />
                </Field>
                <Field label="Email" error={form.formState.errors.email?.message} required>
                  <Input type="email" placeholder="parent@email.com" {...form.register("email")} />
                </Field>
                <Field label="Previous School" error={form.formState.errors.previousSchool?.message}>
                  <Input placeholder="Previous school (optional)" {...form.register("previousSchool")} />
                </Field>
                <Field label="Address" error={form.formState.errors.address?.message} className="md:col-span-2" required>
                  <Textarea rows={3} placeholder="House number, street, city" {...form.register("address")} />
                </Field>
                <Field label="Additional Message" error={form.formState.errors.message?.message} className="md:col-span-2">
                  <Textarea rows={3} placeholder="Share achievements, preferences, or questions" {...form.register("message")} />
                </Field>
                <div className="md:col-span-2 flex flex-col gap-3">
                  <Button type="submit" className="h-12 text-lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Enquiry"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By submitting you consent to Montessori EM High School contacting you via phone or email.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Admissions Helpdesk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  Reach our counsellors Monday-Saturday, 9:00AM-6:00PM for document checklists, campus tour slots, and fee details.
                </p>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${SCHOOL_PHONE_TEL}`} className="font-semibold text-primary">
                      {SCHOOL_PHONE_DISPLAY}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href="mailto:admissions@montessorihighschool.edu" className="font-semibold text-primary">
                      admissions@montessorihighschool.edu
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Montessori EM High School, Road No. 3, Jubilee Hills, Hyderabad.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Submission Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {recentSubmission ? (
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900">Thank you, {recentSubmission.studentName}!</p>
                    <p>Your enquiry for Class {recentSubmission.classApplyingFor} is logged. Expect a confirmation call shortly.</p>
                  </div>
                ) : (
                  <p>
                    Enquiries instantly sync with our admissions team. After submitting, watch for confirmation SMS/email
                    within one business day.
                  </p>
                )}
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>- Average response time: &lt; 6 hours</li>
                  <li>- 100% data encryption - only admissions counsellors can view submissions</li>
                  <li>- Bring original documents during counselling</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  children,
  error,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
