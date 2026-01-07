import { useAuthStore, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
export function Navigation() {
    const { user, college } = useAuthStore();
    const logout = useLogout();
    const [location] = useLocation();
    if (!user || !college)
        return null;
    const dashboardPath = user.role === 'superadmin' ? '/superadmin/dashboard' :
        user.role === 'admin' ? '/admin/dashboard' :
            '/guard/dashboard';
    return (<nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={dashboardPath} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
             <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold font-display">
                SS
             </div>
             <span className="font-display font-bold text-lg hidden md:block">
               {college.name}
             </span>
          </Link>
          <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold capitalize border border-border">
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4"/>
            {user.username}
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 sm:mr-2"/>
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>);
}
