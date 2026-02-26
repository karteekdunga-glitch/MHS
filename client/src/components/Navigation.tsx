import { Link, useLocation } from "wouter";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Academics", href: "#academics" },
    { name: "Admissions", href: "#" },
    { name: "Student Life", href: "#" },
    { name: "Faculty", href: "#faculty" },
    { name: "Contact", href: "#" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-accent" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">
                MONTESSORI
              </h1>
              <p className="text-xs text-primary-foreground/80 font-medium tracking-wider">
                HIGH SCHOOL (SSC)
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/90 hover:text-accent transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button variant="secondary" className="font-bold text-primary hover:bg-accent hover:text-accent-foreground border-none shadow-md" asChild>
              <Link href="/admin">Portal Login</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-primary-foreground"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/10 absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-3 py-3 text-base font-medium text-primary-foreground hover:bg-primary-foreground/10 hover:text-accent rounded-md"
                onClick={() => setIsMobileOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/admin">Portal Login</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
