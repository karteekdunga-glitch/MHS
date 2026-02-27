import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useFaculty } from "@/hooks/use-faculty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone } from "lucide-react";

export default function Faculty() {
  const { data: faculty = [], isLoading } = useFaculty("published");
  const profiles = (faculty as any[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="flex-1">
        <section className="py-16 bg-white border-b">
          <div className="container mx-auto px-4 text-center space-y-4 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-primary">Faculty</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Meet the Mentors Behind Montessori High School
            </h1>
            <p className="text-base md:text-lg text-slate-600">
              Every published profile below is powered by the admin dashboard, ensuring the public website always reflects
              the latest staff roster, qualifications, and contact information.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <Card className="max-w-2xl mx-auto text-center shadow-lg">
              <CardContent className="py-16 space-y-3">
                <h2 className="text-2xl font-semibold text-primary">Faculty profiles will appear here soon.</h2>
                <p className="text-muted-foreground">
                  The admin team has not published any faculty members yet. Please check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <Card key={profile.id} className="overflow-hidden shadow-md border-0">
                  <div className="h-56 w-full bg-slate-100">
                    {profile.imageUrl ? (
                      <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Image coming soon
                      </div>
                    )}
                  </div>
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{profile.department}</Badge>
                      {profile.experience && (
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {profile.experience}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{profile.name}</CardTitle>
                    <p className="text-sm text-primary font-semibold">{profile.role}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    {profile.qualification && (
                      <p>
                        <span className="font-semibold">Qualification: </span>
                        {profile.qualification}
                      </p>
                    )}
                    {profile.description && <p className="leading-relaxed">{profile.description}</p>}
                    <div className="pt-3 space-y-2 text-sm">
                      {profile.email && (
                        <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-primary hover:underline">
                          <Mail className="h-4 w-4" />
                          {profile.email}
                        </a>
                      )}
                      {profile.phone && (
                        <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                          <Phone className="h-4 w-4" />
                          {profile.phone}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
