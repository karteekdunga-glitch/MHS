import { GraduationCap, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
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
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Admissions 2024</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Academic Calendar</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Results & Achievements</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent shrink-0" />
                <span>Tallapudi, Kukunuru,<br/>Andhra Pradesh 534341</span>
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
        
        <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Montessori High School (SSC). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
