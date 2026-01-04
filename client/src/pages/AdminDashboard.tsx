import { useState } from "react";
import { useAuthStore } from "@/hooks/use-auth";
import { useSeminars, useCreateSeminar } from "@/hooks/use-seminars";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar, MapPin, Users, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function AdminDashboard() {
  const { user, college } = useAuthStore();
  const { data: seminars, isLoading } = useSeminars(college?.id ?? 0);
  const { mutate: createSeminar, isPending } = useCreateSeminar();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    rows: 5,
    cols: 5,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!college) return;

      // Generate a slug from the title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      createSeminar({
        ...formData,
        collegeId: college.id,
        thumbnail: "", // Optional
        slug, // Add the generated slug here
      }, {
      onSuccess: () => {
        toast({ title: "Seminar Created", description: "Event is now live for registration" });
        setIsDialogOpen(false);
        setFormData({ title: "", description: "", date: "", time: "", venue: "", rows: 5, cols: 5 });
      },
      onError: (err) => {
        toast({ title: "Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const getPublicLink = (slug: string) => `${window.location.origin}/${slug}/register`;
  const getViewLink = (slug: string) => `${window.location.origin}/${slug}`;

  if (!user || !college) return <div>Access Denied</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">Manage Seminars</h1>
            <p className="text-muted-foreground">Create and monitor your events</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> New Seminar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Seminar</DialogTitle>
                <DialogDescription>Set up details and seating arrangement.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="details">Event Details</TabsTrigger>
                    <TabsTrigger value="seating">Seating Layout</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input 
                        value={formData.title} 
                        onChange={e => setFormData(p => ({...p, title: e.target.value}))}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input 
                          type="date"
                          value={formData.date} 
                          onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input 
                          type="time"
                          value={formData.time} 
                          onChange={e => setFormData(p => ({...p, time: e.target.value}))}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input 
                        value={formData.venue} 
                        onChange={e => setFormData(p => ({...p, venue: e.target.value}))}
                        required 
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="seating" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rows</Label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={20}
                          value={formData.rows} 
                          onChange={e => setFormData(p => ({...p, rows: parseInt(e.target.value)}))}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Columns</Label>
                        <Input 
                          type="number"
                          min={1} 
                          max={20}
                          value={formData.cols} 
                          onChange={e => setFormData(p => ({...p, cols: parseInt(e.target.value)}))}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 border rounded-lg p-4 bg-slate-50 text-center">
                      <p className="text-sm font-medium mb-4">Grid Preview ({formData.rows * formData.cols} total seats)</p>
                      <div 
                        className="inline-grid gap-1 bg-white p-2 border rounded"
                        style={{ gridTemplateColumns: `repeat(${formData.cols}, minmax(20px, 1fr))` }}
                      >
                        {Array.from({ length: formData.rows * formData.cols }).map((_, i) => (
                          <div key={i} className="w-5 h-5 bg-slate-200 rounded-sm" />
                        ))}
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full mt-4" disabled={isPending}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Publish Seminar"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Seminar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : seminars?.map((seminar) => (
            <Card key={seminar.id} className="card-hover flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1" title={seminar.title}>{seminar.title}</CardTitle>
                <CardDescription className="line-clamp-2">{seminar.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(seminar.date).toLocaleDateString()} at {seminar.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{seminar.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{seminar.rows * seminar.cols} Seats Capacity</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-slate-50/50 flex justify-between items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2" /> Show QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                      <DialogTitle>Registration QR Code</DialogTitle>
                      <DialogDescription>Scan to register for {seminar.title}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="p-4 bg-white border rounded-xl shadow-sm">
                        <QRCodeSVG value={getPublicLink(seminar.slug)} size={200} />
                      </div>
                      <a 
                        href={getPublicLink(seminar.slug)} 
                        target="_blank" 
                        className="text-xs text-primary hover:underline text-center break-all"
                      >
                        {getPublicLink(seminar.slug)}
                      </a>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" asChild>
                  <a href={getViewLink(seminar.slug)} target="_blank">View Page</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
