import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCollege } from "@/hooks/use-colleges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import { Link } from "wouter";
export default function RegisterCollege() {
    const [, setLocation] = useLocation();
    const { mutate: createCollege, isPending } = useCreateCollege();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        superAdminUsername: "",
        superAdminPassword: ""
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.superAdminUsername || !formData.superAdminPassword)
            return;
        createCollege(formData, {
            onSuccess: () => {
                toast({ title: "Success", description: "College registered successfully! Please login." });
                setLocation("/");
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };
    return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1"/> Back to Login
        </Link>
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent text-white mb-2">
            <Building2 className="w-6 h-6"/>
          </div>
          <h1 className="text-3xl font-display font-bold">Register Institution</h1>
          <p className="text-muted-foreground">Set up your college and super admin account</p>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name">College Name</Label>
                <Input id="name" placeholder="e.g. Springfield University" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required/>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"/>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Super Admin Credentials</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={formData.superAdminUsername} onChange={e => setFormData(prev => ({ ...prev, superAdminUsername: e.target.value }))} required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={formData.superAdminPassword} onChange={e => setFormData(prev => ({ ...prev, superAdminPassword: e.target.value }))} required/>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                Register College
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>);
}
