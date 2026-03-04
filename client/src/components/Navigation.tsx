import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SCHOOL_PHONE_TEL } from "@/lib/branding";
import { SchoolLogo } from "@/components/SchoolLogo";
import { useSitePreferences } from "@/hooks/use-site-preferences";

type NavLink = { name: string; href: string };

export function Navigation() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: sitePrefs } = useSitePreferences();
  const showResultsLink = sitePrefs?.showResultsInNav ?? true;

  const navLinks = useMemo<NavLink[]>(() => {
    const links: Array<NavLink | null> = [
      { name: "Home", href: "/" },
      { name: "Events", href: "/events" },
      { name: "Academics", href: "/academics" },
      { name: "Student Life", href: "/student-life" },
      { name: "Faculty", href: "/faculty" },
      showResultsLink ? { name: "Results", href: "/results" } : null,
      { name: "Rankers", href: "/rankers" },
      { name: "Admissions", href: "/admissions" },
      { name: "Contact", href: `tel:${SCHOOL_PHONE_TEL}` },
    ];
    return links.filter((link): link is NavLink => Boolean(link));
  }, [showResultsLink]);

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#041540] via-[#083077] to-[#041540] text-primary-foreground shadow-xl border-b border-white/10 supports-[backdrop-filter]:bg-primary/90 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-4 py-3 md:py-4">
          <div className="flex items-center gap-4 shrink-0">
            <SchoolLogo size={70} className="h-16 w-16 bg-white rounded-full p-2 shadow-md" />
            <div className="text-white leading-tight">
              <span className="block text-2xl md:text-[28px] font-black uppercase tracking-[0.18em]">
                Montessori EM High School
              </span>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-white text-primary px-4 py-1 text-[0.68rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.32em] shadow-sm">
                  English Medium (EM)
                </span>
              </div>
            </div>
          </div>

          <button
            className="md:hidden ml-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 text-primary-foreground transition hover:bg-white/20"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <nav className="hidden md:flex flex-1 justify-center gap-6 text-[0.82rem] font-semibold uppercase tracking-[0.18em]">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-primary-foreground/90 hover:text-accent transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:block shrink-0">
            <Button variant="secondary" className="font-bold text-primary hover:bg-accent hover:text-accent-foreground border-none shadow-md" asChild>
              <Link href="/admin">Portal Login</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileOpen && (
        <div className="md:hidden absolute inset-x-0 top-full bg-gradient-to-b from-[#041540] via-[#052768] to-[#041540] border-t border-white/10 shadow-2xl">
          <div className="px-4 pt-3 pb-6 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-3 py-3 text-base font-semibold uppercase tracking-[0.2em] text-primary-foreground/90 rounded-md hover:bg-white/10"
                onClick={() => setIsMobileOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold" asChild>
                <Link href="/admin">Portal Login</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
