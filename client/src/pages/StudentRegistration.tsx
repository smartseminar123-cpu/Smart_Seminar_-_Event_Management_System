import { useState } from "react";
import { useParams } from "wouter";
import { useSeminar } from "@/hooks/use-seminars";
import { useRegistrations, useCreateRegistration } from "@/hooks/use-registrations";
import { SeatingGrid } from "@/components/SeatingGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, MapPin, Download, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";

export default function StudentRegistration() {
  const params = useParams();
  const id = Number(params.id);
  const { data: seminar, isLoading: seminarLoading } = useSeminar(id);
  const { data: registrations, isLoading: regsLoading } = useRegistrations(id);
  const { mutate: register, isPending } = useCreateRegistration();
  const { toast } = useToast();

  const [step, setStep] = useState<"seat" | "details" | "success">("seat");
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null);
  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    phone: "",
    course: "",
    semester: "",
  });
  const [ticketData, setTicketData] = useState<{ uniqueId: string } | null>(null);

  const handleSeatSelect = (row: number, col: number) => {
    setSelectedSeat({ row, col });
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !seminar) return;

    register({
      seminarId: seminar.id,
      seatRow: selectedSeat.row,
      seatCol: selectedSeat.col,
      ...formData
    }, {
      onSuccess: (data) => {
        setTicketData(data);
        setStep("success");
        toast({ title: "Registration Successful", description: "Your seat has been booked!" });
      },
      onError: (err) => {
        toast({ title: "Booking Failed", description: err.message, variant: "destructive" });
        if (err.message.includes("taken")) {
           // Refresh data if seat taken
           window.location.reload();
        }
      }
    });
  };

  const downloadTicket = async () => {
    if (!ticketData || !seminar) return;

    const doc = new jsPDF();
    const qrUrl = await QRCode.toDataURL(ticketData.uniqueId);

    // Header
    doc.setFillColor(63, 81, 181); // Primary color
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Seminar Entry Ticket", 105, 25, { align: "center" });

    // Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(seminar.title, 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(seminar.date).toDateString()}`, 20, 75);
    doc.text(`Time: ${seminar.time}`, 20, 85);
    doc.text(`Venue: ${seminar.venue}`, 20, 95);

    doc.setFontSize(14);
    doc.text(`Attendee: ${formData.studentName}`, 20, 115);
    doc.text(`Seat: Row ${selectedSeat?.row} - Seat ${selectedSeat?.col}`, 20, 125);
    doc.text(`Ticket ID: ${ticketData.uniqueId}`, 20, 135);

    // QR Code
    doc.addImage(qrUrl, 'PNG', 75, 150, 60, 60);
    doc.setFontSize(10);
    doc.text("Show this QR code at the entrance", 105, 220, { align: "center" });

    doc.save(`Ticket-${formData.studentName}.pdf`);
  };

  if (seminarLoading || regsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!seminar) return <div>Seminar not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-display font-bold">{seminar.title}</h1>
          <div className="flex justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{new Date(seminar.date).toLocaleDateString()} at {seminar.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{seminar.venue}</span>
            </div>
          </div>
        </div>

        {step === "seat" && (
          <Card className="shadow-xl border-primary/10">
            <CardHeader>
              <CardTitle className="text-center">Select Your Seat</CardTitle>
              <CardDescription className="text-center">Choose an available seat to proceed</CardDescription>
            </CardHeader>
            <CardContent>
               <SeatingGrid 
                 rows={seminar.rows}
                 cols={seminar.cols}
                 registrations={registrations || []}
                 onSelectSeat={handleSeatSelect}
               />
            </CardContent>
          </Card>
        )}

        {step === "details" && (
          <Card className="shadow-xl border-primary/10 animate-in fade-in slide-in-from-bottom-4">
            <CardHeader>
              <CardTitle>Enter Your Details</CardTitle>
              <CardDescription>Selected Seat: Row {selectedSeat?.row}, Number {selectedSeat?.col}</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.studentName}
                    onChange={e => setFormData(p => ({...p, studentName: e.target.value}))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData(p => ({...p, phone: e.target.value}))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Input 
                      value={formData.course}
                      onChange={e => setFormData(p => ({...p, course: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Input 
                      value={formData.semester}
                      onChange={e => setFormData(p => ({...p, semester: e.target.value}))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep("seat")}>Back</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Booking"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {step === "success" && (
          <Card className="shadow-xl border-green-200 bg-green-50/50 animate-in zoom-in-95">
            <CardContent className="pt-8 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-green-800">Registration Confirmed!</h2>
                <p className="text-green-700">Your seat has been successfully reserved.</p>
              </div>
              
              <Button size="lg" onClick={downloadTicket} className="bg-green-600 hover:bg-green-700">
                <Download className="w-5 h-5 mr-2" />
                Download Ticket
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Please save your ticket and present the QR code at the venue.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
