import { useState } from "react";
import { useAuthStore } from "@/hooks/use-auth";
import { useUsers, useCreateUser, useSuperAdminStats } from "@/hooks/use-users";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, School, BarChart3, UserPlus } from "lucide-react";
export default function SuperAdminDashboard() {
    const { user, college } = useAuthStore();
    const { data: users, isLoading: usersLoading } = useUsers(college?.id ?? 0);
    const { data: stats } = useSuperAdminStats(college?.id ?? 0);
    const { mutate: createUser, isPending: isCreating } = useCreateUser();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        role: "admin",
    });
    const handleCreateUser = (e) => {
        e.preventDefault();
        if (!college)
            return;
        createUser({
            ...newUser,
            collegeId: college.id,
        }, {
            onSuccess: () => {
                toast({ title: "User created", description: "New staff member added successfully" });
                setIsDialogOpen(false);
                setNewUser({ username: "", password: "", role: "admin" });
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };
    if (!user || !college)
        return <div>Access Denied</div>;
    return (<div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground">Manage your institution's staff and view insights.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <UserPlus className="w-4 h-4 mr-2"/> Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create account for admin or security guard.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} required/>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required/>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Event Admin</SelectItem>
                      <SelectItem value="guard">Security Guard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Seminars</CardTitle>
              <School className="w-4 h-4 text-primary"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSeminars ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active events scheduled</p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
              <BarChart3 className="w-4 h-4 text-accent"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats?.averageAttendance ?? 0)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Seat occupancy rate</p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Staff Members</CardTitle>
              <Users className="w-4 h-4 text-emerald-500"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Admins and guards</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/></div>) : (<Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (<TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={u.role === 'admin' ? "bg-blue-100 text-blue-700" :
                    u.role === 'guard' ? "bg-amber-100 text-amber-700" : ""}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"/>
                        Active
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>)}
          </CardContent>
        </Card>
      </main>
    </div>);
}
