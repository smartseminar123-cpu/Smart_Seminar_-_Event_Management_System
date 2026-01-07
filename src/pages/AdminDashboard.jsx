import { useState, useMemo } from "react";
import { useAuthStore } from "@/hooks/use-auth";
import { useSeminars, useCreateSeminar } from "@/hooks/use-seminars";
import { useHalls } from "@/hooks/use-halls";
import { CreateHallModal } from "@/components/CreateHallModal";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar, MapPin, Users, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
export default function AdminDashboard() {
    const { user, college } = useAuthStore();
    const { data: seminars, isLoading } = useSeminars(college?.id ?? 0);
    const { data: halls } = useHalls(college?.id ?? 0);
    const { mutate: createSeminar, isPending } = useCreateSeminar();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isHallModalOpen, setIsHallModalOpen] = useState(false);
    const [seatingType, setSeatingType] = useState("grid"); // "grid" | "hall"
    const [selectedHallId, setSelectedHallId] = useState("");
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        rows: 5,
        cols: 5,
    });

    const [customRowConfigs, setCustomRowConfigs] = useState([]);

    // Generate available row labels based on Total Rows (formData.rows)
    const availableLabels = useMemo(() => {
        return Array.from({ length: formData.rows }, (_, i) => String.fromCharCode(65 + i));
    }, [formData.rows]);

    // Filter out labels that are already configured
    const unconfiguredLabels = useMemo(() => {
        const configured = new Set(customRowConfigs.map(rc => rc.label));
        return availableLabels.filter(l => !configured.has(l));
    }, [availableLabels, customRowConfigs]);

    const handleAddRowConfig = () => {
        if (unconfiguredLabels.length === 0) return;
        const nextLabel = unconfiguredLabels[0];
        setCustomRowConfigs([...customRowConfigs, { id: Math.random().toString(36).substr(2, 9), label: nextLabel, seats: 10 }]);
    };

    const updateRowConfig = (id, field, value) => {
        setCustomRowConfigs(configs => configs.map(c => {
            if (c.id !== id) return c;
            return { ...c, [field]: value };
        }));
    };

    const removeRowConfig = (id) => {
        setCustomRowConfigs(configs => configs.filter(c => c.id !== id));
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!college)
            return;

        if (seatingType === "grid" && customRowConfigs.length === 0) {
            toast({ title: "Validation Error", description: "Please configure at least one row for the grid.", variant: "destructive" });
            return;
       }

        // Generate a slug from the title
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        let seminarPayload = {
            ...formData,
            collegeId: college.id,
            thumbnail: "", // Optional
            slug, // Add the generated slug here
            seatingSource: seatingType === "hall" ? "HALL" : "GRID"
        };

        if (seatingType === "grid") {
             const rowConfig = {};
             let maxCol = 0;
             let totalSeats = 0;
 
             customRowConfigs.forEach(rc => {
                 if (rc.label) {
                     const rowIdx = rc.label.charCodeAt(0) - 64; // A->1
                     const seats = parseInt(rc.seats) || 0;
                     rowConfig[rowIdx] = seats;
                     if (seats > maxCol) maxCol = seats;
                     totalSeats += seats;
                 }
             });
 
             seminarPayload.rowConfig = rowConfig;
             seminarPayload.cols = maxCol;
             seminarPayload.totalSeats = totalSeats;
        }

        if (seatingType === "hall" && selectedHallId) {
             const hall = halls?.find(h => String(h.id) === String(selectedHallId));
             if (hall) {
                 const rowConfig = {};
                 let maxRow = 0;
                 let maxCol = 0;
     
                 Object.entries(hall.rows).forEach(([label, seats]) => {
                     const rowIdx = label.charCodeAt(0) - 64; // A->1, B->2
                     rowConfig[rowIdx] = seats;
                     if (rowIdx > maxRow) maxRow = rowIdx;
                     if (seats > maxCol) maxCol = seats;
                 });
     
                 seminarPayload.rows = maxRow;
                 seminarPayload.cols = maxCol;
                 seminarPayload.rowConfig = rowConfig;
                 seminarPayload.hallId = hall.id;
                 seminarPayload.totalSeats = hall.totalSeats;
             }
        }

        createSeminar(seminarPayload, {
            onSuccess: () => {
                toast({ title: "Seminar Created", description: "Event is now live for registration" });
                setIsDialogOpen(false);
                setFormData({ title: "", description: "", date: "", time: "", venue: "", rows: 5, cols: 5 });
                setSeatingType("grid");
                setSelectedHallId("");
                setCustomRowConfigs([]);
            },
            onError: (err) => {
                toast({ title: "Failed", description: err.message, variant: "destructive" });
            }
        });
    };
    const getPublicLink = (slug) => `${window.location.origin}/${slug}/register`;
    const getViewLink = (slug) => `${window.location.origin}/${slug}`;
    if (!user || !college)
        return <div>Access Denied</div>;
    return (<div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Manage Seminars</h1>
            <p className="text-muted-foreground">Create and monitor your events</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="secondary" onClick={() => setIsHallModalOpen(true)} className="w-full sm:w-auto">
               <Plus className="w-4 h-4 mr-2"/> Create New Hall
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2"/> New Seminar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                      <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required/>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} required/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required/>
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input type="time" value={formData.time} onChange={e => setFormData(p => ({ ...p, time: e.target.value }))} required/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input value={formData.venue} onChange={e => setFormData(p => ({ ...p, venue: e.target.value }))} required/>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="seating" className="space-y-4">
                    <div className="space-y-3">
                        <Label>Seating Type</Label>
                        <RadioGroup value={seatingType} onValueChange={setSeatingType} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="grid" id="st-grid" />
                                <Label htmlFor="st-grid">Custom Grid</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="hall" id="st-hall" />
                                <Label htmlFor="st-hall">Use Existing Hall</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {seatingType === "hall" && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label>Select Hall</Label>
                            <Select value={selectedHallId} onValueChange={setSelectedHallId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a hall..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {halls?.map(h => (
                                        <SelectItem key={h.id} value={String(h.id)}>{h.hallName} ({h.totalSeats} seats)</SelectItem>
                                    ))}
                                    {(!halls || halls.length === 0) && <div className="p-2 text-sm text-muted-foreground">No halls found</div>}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {seatingType === "grid" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Total Rows</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        min={1} 
                                        max={26} 
                                        value={formData.rows} 
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setFormData(p => ({ ...p, rows: Math.min(26, Math.max(1, val)) }));
                                            // Remove configs for rows that no longer exist
                                            setCustomRowConfigs(prev => prev.filter(c => 
                                                c.label.charCodeAt(0) - 65 < val
                                            ));
                                        }} 
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        (A - {String.fromCharCode(64 + formData.rows)})
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                                <div className="flex justify-between items-center">
                                    <Label>Row Configurations</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={handleAddRowConfig} disabled={unconfiguredLabels.length === 0}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Row
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {customRowConfigs.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No rows configured yet.</p>
                                    )}
                                    {customRowConfigs.map((config) => (
                                        <div key={config.id} className="flex items-center gap-3 bg-white p-2 rounded border shadow-sm animate-in slide-in-from-left-2">
                                            <div className="w-24">
                                                <Select 
                                                    value={config.label} 
                                                    onValueChange={(val) => updateRowConfig(config.id, "label", val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[config.label, ...unconfiguredLabels].sort().map(l => (
                                                            <SelectItem key={l} value={l}>Row {l}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Seats:</span>
                                                <Input 
                                                    type="number" 
                                                    min={1} 
                                                    value={config.seats} 
                                                    onChange={(e) => updateRowConfig(config.id, "seats", parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => removeRowConfig(config.id)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 border rounded-lg p-4 bg-slate-50 text-center">
                                <p className="text-sm font-medium mb-4">
                                    Grid Preview ({customRowConfigs.reduce((acc, curr) => acc + (parseInt(curr.seats) || 0), 0)} total seats)
                                </p>
                                <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
                                    <div className="w-3/4 h-6 bg-slate-300 rounded-sm mb-4 flex items-center justify-center text-xs text-slate-600 font-medium">SCREEN</div>
                                    {availableLabels.map((label) => {
                                        const config = customRowConfigs.find(rc => rc.label === label);
                                        if (!config) {
                                            return (
                                                <div key={label} className="flex items-center gap-4 opacity-30">
                                                    <div className="w-8 font-bold text-slate-400 text-right">{label}</div>
                                                    <div className="h-8 border-2 border-dashed border-slate-300 rounded flex items-center justify-center px-4 text-xs text-slate-400">
                                                        Not Configured
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const seats = parseInt(config.seats) || 0;
                                        return (
                                            <div key={label} className="flex items-center gap-2">
                                                <span className="text-xs font-bold w-4 text-right text-slate-500">{label}</span>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: seats }).map((_, i) => (
                                                        <div key={i} className="w-5 h-5 bg-white border border-slate-300 rounded-sm flex items-center justify-center text-[10px] text-slate-400">
                                                            {i + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {seatingType === "hall" && selectedHallId && (() => {
                        const hall = halls?.find(h => String(h.id) === String(selectedHallId));
                        if (!hall) return null;
                        
                        // Sort rows by label A, B, C...
                        const sortedRows = Object.entries(hall.rows).sort((a, b) => a[0].localeCompare(b[0]));
                        
                        return (
                            <div className="mt-4 border rounded-lg p-4 bg-slate-50 text-center">
                                <p className="text-sm font-medium mb-4">Hall Preview: {hall.hallName} ({hall.totalSeats} seats)</p>
                                <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
                                    <div className="w-3/4 h-6 bg-slate-300 rounded-sm mb-4 flex items-center justify-center text-xs text-slate-600 font-medium">SCREEN</div>
                                    {sortedRows.map(([label, seats]) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <span className="text-xs font-bold w-4 text-right text-slate-500">{label}</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: seats }).map((_, i) => (
                                                    <div key={i} className="w-5 h-5 bg-white border border-slate-300 rounded-sm flex items-center justify-center text-[10px] text-slate-400">
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                    
                    <Button type="submit" className="w-full mt-4" disabled={isPending}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Publish Seminar"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Seminar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (<div className="col-span-3 flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/>
            </div>) : seminars?.map((seminar) => (<Card key={seminar.id} className="card-hover flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1" title={seminar.title}>{seminar.title}</CardTitle>
                <CardDescription className="line-clamp-2">{seminar.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4"/>
                    <span>{new Date(seminar.date).toLocaleDateString()} at {seminar.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4"/>
                    <span>{seminar.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4"/>
                    <span>{seminar.totalSeats || (seminar.rows * seminar.cols)} Seats Capacity</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-slate-50/50 flex justify-between items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2"/> Show QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                      <DialogTitle>Registration QR Code</DialogTitle>
                      <DialogDescription>Scan to register for {seminar.title}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="p-4 bg-white border rounded-xl shadow-sm">
                        <QRCodeSVG value={getPublicLink(seminar.slug)} size={200}/>
                      </div>
                      <a href={getPublicLink(seminar.slug)} target="_blank" className="text-xs text-primary hover:underline text-center break-all">
                        {getPublicLink(seminar.slug)}
                      </a>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" asChild>
                  <a href={getViewLink(seminar.slug)} target="_blank">View Page</a>
                </Button>
              </CardFooter>
            </Card>))}
        </div>
        
        <CreateHallModal 
            isOpen={isHallModalOpen} 
            onClose={() => setIsHallModalOpen(false)} 
            collegeId={college?.id ?? 0} 
        />
      </main>
    </div>);
}
