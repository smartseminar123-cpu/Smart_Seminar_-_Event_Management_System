import { useState } from "react";
import { useColleges } from "@/hooks/use-colleges";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
export default function Home() {
    const [collegeId, setCollegeId] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { data: colleges, isLoading: collegesLoading } = useColleges();
    const { mutate: login, isPending: isLoggingIn } = useLogin();
    const { toast } = useToast();
    const handleLogin = (e) => {
        e.preventDefault();
        if (!collegeId || !username || !password) {
            toast({ title: "Missing fields", description: "Please fill in all fields", variant: "destructive" });
            return;
        }
        login({ collegeId: parseInt(collegeId), username, password }, {
            onError: (err) => {
                toast({ title: "Login failed", description: err.message, variant: "destructive" });
            }
        });
    };
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4 shadow-xl shadow-primary/20">
            <ShieldCheck className="w-8 h-8"/>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to manage your seminars</p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Select your college and enter credentials</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Select value={collegeId} onValueChange={setCollegeId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select your institution"/>
                  </SelectTrigger>
                  <SelectContent>
                    {collegesLoading ? (<div className="p-2 flex justify-center"><Loader2 className="w-4 h-4 animate-spin"/></div>) : (colleges?.map((college) => (<SelectItem key={college.id} value={String(college.id)}>
                          {college.name}
                        </SelectItem>)))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-white"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white"/>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                Sign In
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Register College
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>);
}
