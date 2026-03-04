import { MapPin, Phone, Mail } from "lucide-react";
import { SCHOOL_PHONE_DISPLAY, SCHOOL_PHONE_TEL, SCHOOL_EMAIL } from "@/lib/branding";
import { SchoolLogo } from "@/components/SchoolLogo";

const FOOTER_BG = "/images/footer-campus.jpg";
const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3812.86479619912!2d81.6590475757753!3d17.12809321022192!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a37078b7f86d983%3A0xc44bee43055d8158!2sMONTESSORI%20HIGH%20SCHOOL%20%2C%20TALLAPUDI!5e0!3m2!1sen!2sin!4v1772561538660!5m2!1sen!2sin";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Admissions", href: "/admissions" },
  { label: "Academics", href: "/academics" },
  { label: "Student Life", href: "/student-life" },
  { label: "Results Portal", href: "/results" },
  { label: "Rankers", href: "/rankers" },
  { label: "Events", href: "/events" },
  { label: "Faculty", href: "/faculty" },
  { label: "Contact", href: `tel:${SCHOOL_PHONE_TEL}` },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden text-slate-100">
      <div aria-hidden className="absolute inset-0">
        <img
          src={FOOTER_BG}
          alt="Montessori EM High School campus"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-[2px] mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/80" />
      </div>
      <div className="relative pt-16 pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <SchoolLogo size={48} className="h-12 w-12 rounded-full bg-white p-1 shadow" />
                <h2 className="text-xl font-bold font-serif">Montessori EM High School</h2>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Empowering students with knowledge, character, and vision for a brighter tomorrow. Excellence in education since establishment.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white font-serif">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="hover:text-accent transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white font-serif">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent shrink-0" />
                  <span>
                    Tallapudi, Kukunuru,
                    <br />
                    Andhra Pradesh 534341
                  </span>
                </li>
                <li className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-2 text-xs font-semibold text-accent">
                    <MapPin className="h-4 w-4" />
                    Navigate to School
                  </span>
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-white/20">
                    <iframe
                      title="Montessori EM High School Map"
                      src={MAP_EMBED_URL}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-56"
                    />
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-accent shrink-0" />
                  <a
                    href={`tel:${SCHOOL_PHONE_TEL}`}
                    className="hover:text-accent transition-colors"
                    aria-label={`Call Montessori EM High School at ${SCHOOL_PHONE_DISPLAY}`}
                  >
                    {SCHOOL_PHONE_DISPLAY}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-accent shrink-0" />
                  <a href={`mailto:${SCHOOL_EMAIL}`} className="hover:text-accent transition-colors">
                    {SCHOOL_EMAIL}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 text-center text-sm text-white/80">
            <p>© {new Date().getFullYear()} Montessori EM High School. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

