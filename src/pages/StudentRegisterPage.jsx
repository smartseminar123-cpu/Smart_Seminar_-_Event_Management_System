import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useSeminarBySlug } from "@/hooks/use-seminars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Calendar, MapPin, ArrowRight } from "lucide-react";
export default function StudentRegisterPage() {
    const [match, params] = useRoute("/:slug/register");
    const slug = params?.slug || "";
    const { data: seminar, isLoading } = useSeminarBySlug(slug);
    const [, setLocation] = useLocation();
    const [formData, setFormData] = useState({
        collegeName: "",
        course: "",
        semester: "",
        studentName: "",
        email: "",
        phone: "",
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, you might save this to local storage or a "draft" API endpoint.
        // For now, we'll pass it via state/query params or just expect the user to re-enter
        // (since the prompt says "Temporarily store student data", we'll use localStorage)
        localStorage.setItem(`registration_${slug}`, JSON.stringify(formData));
        setLocation(`/${slug}/seats`);
    };
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin"/></div>;
    }
    if (!seminar)
        return <div>Seminar not found</div>;
    return (<div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-display font-bold">{seminar.title}</h1>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5"/>
              <span>{new Date(seminar.date).toLocaleDateString()} at {seminar.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5"/>
              <span>{seminar.venue}</span>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-primary/10">
          <CardHeader>
            <CardTitle>Student Registration</CardTitle>
            <CardDescription>Please fill in your details to proceed to seat selection.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School / College Name (Optional)</Label>
                <Input value={formData.collegeName} onChange={e => setFormData(p => ({ ...p, collegeName: e.target.value }))} placeholder="Enter your institution name"/>
              </div>

              {formData.collegeName && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Course <span className="text-red-500">*</span></Label>
                    <Input value={formData.course} onChange={e => setFormData(p => ({ ...p, course: e.target.value }))} required placeholder="e.g. B.Tech CS"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester <span className="text-red-500">*</span></Label>
                    <Input value={formData.semester} onChange={e => setFormData(p => ({ ...p, semester: e.target.value }))} required placeholder="e.g. 6th"/>
                  </div>
                </div>)}

              <div className="space-y-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input value={formData.studentName} onChange={e => setFormData(p => ({ ...p, studentName: e.target.value }))} required placeholder="Enter your full name"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required placeholder="your.email@example.com"/>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number <span className="text-red-500">*</span></Label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} required placeholder="+91 98765 43210"/>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Next: Select Seat <ArrowRight className="w-4 h-4 ml-2"/>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>);
}
