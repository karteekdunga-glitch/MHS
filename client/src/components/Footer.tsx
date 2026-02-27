import { GraduationCap, MapPin, Phone, Mail } from "lucide-react";

const FOOTER_BG = "/images/footer-campus.jpg";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Admissions", href: "/admissions" },
  { label: "Academics", href: "/academics" },
  { label: "Student Life", href: "/student-life" },
  { label: "Results Portal", href: "/results" },
  { label: "Rankers", href: "/rankers" },
  { label: "Events", href: "/events" },
  { label: "Faculty", href: "/faculty" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden text-slate-100">
      <div aria-hidden className="absolute inset-0">
        <img
          src={FOOTER_BG}
          alt="Montessori High School campus"
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
                <GraduationCap className="h-8 w-8 text-accent" />
                <h2 className="text-xl font-bold font-serif">Montessori High School</h2>
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
                <li>
                  <a
                    href="https://share.google/vdeciSFUx1luhAIjt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-2 text-xs font-semibold text-accent hover:bg-accent hover:text-slate-900 transition-colors"
                  >
                    Navigate to School
                    <MapPin className="h-4 w-4" />
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-accent shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-accent shrink-0" />
                  <span>info@montessoritallapudi.edu</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 text-center text-sm text-white/80">
            <p>© {new Date().getFullYear()} Montessori High School (SSC). All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
