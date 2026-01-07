import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHall } from "@/hooks/use-halls";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, Armchair } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CreateHallModal({ isOpen, onClose, collegeId }) {
    const { mutate: createHall, isPending } = useCreateHall();
    const { toast } = useToast();

    const [hallName, setHallName] = useState("");
    const [totalRows, setTotalRows] = useState(5);
    const [rowConfigs, setRowConfigs] = useState([]); // Array of { id: string, label: string, seats: number }

    // Generate available row labels based on Total Rows
    const availableLabels = useMemo(() => {
        return Array.from({ length: totalRows }, (_, i) => String.fromCharCode(65 + i));
    }, [totalRows]);

    // Filter out labels that are already configured
    const unconfiguredLabels = useMemo(() => {
        const configured = new Set(rowConfigs.map(rc => rc.label));
        return availableLabels.filter(l => !configured.has(l));
    }, [availableLabels, rowConfigs]);

    const handleAddRowConfig = () => {
        if (unconfiguredLabels.length === 0) return;
        const nextLabel = unconfiguredLabels[0];
        setRowConfigs([...rowConfigs, { id: Math.random().toString(36).substr(2, 9), label: nextLabel, seats: 10 }]);
    };

    const updateRowConfig = (id, field, value) => {
        setRowConfigs(configs => configs.map(c => {
            if (c.id !== id) return c;
            return { ...c, [field]: value };
        }));
    };

    const removeRowConfig = (id) => {
        setRowConfigs(configs => configs.filter(c => c.id !== id));
    };

    const handleSave = () => {
        if (!hallName.trim()) {
            toast({ title: "Validation Error", description: "Hall name is required", variant: "destructive" });
            return;
        }
        if (rowConfigs.length === 0) {
            toast({ title: "Validation Error", description: "At least one row must be configured", variant: "destructive" });
            return;
        }

        // Convert array to object for DB
        const rowsMap = {};
        let totalSeats = 0;
        rowConfigs.forEach(rc => {
            if (rc.label) {
                rowsMap[rc.label] = parseInt(rc.seats) || 0;
                totalSeats += rowsMap[rc.label];
            }
        });

        createHall({
            collegeId,
            hallName,
            rows: rowsMap,
            totalSeats,
        }, {
            onSuccess: () => {
                toast({ title: "Hall Created", description: "New hall layout saved successfully" });
                // Reset form
                setHallName("");
                setTotalRows(5);
                setRowConfigs([]);
                onClose();
            },
            onError: (err) => {
                toast({ title: "Failed", description: err.message, variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle>Create New Hall</DialogTitle>
                    <DialogDescription>Define the seating layout for this hall.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto lg:overflow-hidden">
                    {/* Left Column: Configuration */}
                    <div className="space-y-6 lg:overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label>Hall Name <span className="text-red-500">*</span></Label>
                            <Input 
                                placeholder="e.g. Main Auditorium" 
                                value={hallName} 
                                onChange={(e) => setHallName(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Total Rows <span className="text-red-500">*</span></Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    min={1} 
                                    max={26} 
                                    value={totalRows} 
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setTotalRows(Math.min(26, Math.max(1, val)));
                                        // Remove configs for rows that no longer exist
                                        setRowConfigs(prev => prev.filter(c => 
                                            c.label.charCodeAt(0) - 65 < val
                                        ));
                                    }} 
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    (A - {String.fromCharCode(64 + totalRows)})
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                            <div className="flex justify-between items-center">
                                <Label>Row Configurations</Label>
                                <Button size="sm" variant="outline" onClick={handleAddRowConfig} disabled={unconfiguredLabels.length === 0}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Row
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {rowConfigs.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No rows configured yet.</p>
                                )}
                                {rowConfigs.map((config) => (
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
                                                    {/* Include current value plus available ones */}
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
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => removeRowConfig(config.id)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="flex flex-col border rounded-lg overflow-hidden bg-slate-100">
                        <div className="p-3 border-b bg-white font-medium text-sm flex justify-between items-center">
                            <span>Live Preview</span>
                            <span className="text-muted-foreground">
                                Total Seats: {rowConfigs.reduce((acc, curr) => acc + (parseInt(curr.seats) || 0), 0)}
                            </span>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <div className="flex flex-col items-center gap-4 min-w-max mx-auto">
                                <div className="w-full max-w-md h-8 bg-slate-300 rounded-lg mb-8 flex items-center justify-center text-slate-600 text-sm font-medium shadow-sm">
                                    STAGE / SCREEN
                                </div>
                                
                                {availableLabels.map((label) => {
                                    const config = rowConfigs.find(rc => rc.label === label);
                                    if (!config) {
                                        // Render placeholder for unconfigured row
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
                                        <div key={label} className="flex items-center gap-4">
                                            <div className="w-8 font-bold text-slate-600 text-right">{label}</div>
                                            <div className="flex gap-1 justify-center">
                                                {Array.from({ length: seats }).map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="w-6 h-6 bg-white border border-slate-300 rounded-sm shadow-sm flex items-center justify-center text-[10px] text-slate-400"
                                                        title={`Row ${label} Seat ${i+1}`}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Hall
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
