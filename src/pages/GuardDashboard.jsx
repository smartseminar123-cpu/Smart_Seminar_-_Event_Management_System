import { useState, useEffect } from "react";
import { useAuthStore } from "@/hooks/use-auth";
import { useVerifyTicket } from "@/hooks/use-registrations";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Scan, CheckCircle, XCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
export default function GuardDashboard() {
    const { user, college } = useAuthStore();
    const { mutate: verify, isPending } = useVerifyTicket();
    const { toast } = useToast();
    const [scanResult, setScanResult] = useState({ status: null, message: '' });
    useEffect(() => {
        // Only init scanner if no result is currently shown
        if (scanResult.status)
            return;
        // Use a small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scanner.render((decodedText) => {
                scanner.clear();
                handleVerify(decodedText);
            }, (error) => {
                // console.warn(error);
            });
            return () => {
                scanner.clear().catch(console.error);
            };
        }, 100);
        return () => clearTimeout(timer);
    }, [scanResult.status]);
    const handleVerify = (uniqueId) => {
        verify(uniqueId, {
            onSuccess: (data) => {
                setScanResult({
                    status: 'success',
                    message: 'Valid Ticket',
                    details: data.registration
                });
                toast({ title: "Verified", description: "Access Granted", className: "bg-green-500 text-white" });
            },
            onError: (err) => {
                setScanResult({
                    status: 'error',
                    message: err.message || "Invalid Ticket"
                });
                toast({ title: "Access Denied", description: err.message, variant: "destructive" });
            }
        });
    };
    const resetScanner = () => {
        setScanResult({ status: null, message: '' });
    };
    if (!user || !college)
        return <div>Access Denied</div>;
    return (<div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display">Ticket Scanner</h1>
          <p className="text-muted-foreground">Scan attendee QR codes for entry</p>
        </div>

        <Card className="overflow-hidden border-2 border-slate-200">
          <CardContent className="p-0 min-h-[400px] flex flex-col">
            {scanResult.status === null ? (<div id="reader" className="flex-1 w-full bg-slate-900"/>) : (<div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                 {scanResult.status === 'success' ? (<>
                     <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                       <CheckCircle className="w-12 h-12"/>
                     </div>
                     <div className="text-center">
                       <h2 className="text-2xl font-bold text-green-700">Access Granted</h2>
                       <p className="text-lg font-medium mt-2">{scanResult.details?.studentName}</p>
                       <p className="text-muted-foreground">
                         Seat: Row {scanResult.details?.seatRow} - {scanResult.details?.seatCol}
                       </p>
                     </div>
                   </>) : (<>
                     <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                       <XCircle className="w-12 h-12"/>
                     </div>
                     <div className="text-center">
                       <h2 className="text-2xl font-bold text-red-700">Access Denied</h2>
                       <p className="text-lg font-medium mt-2">{scanResult.message}</p>
                     </div>
                   </>)}
                 
                 <Button size="lg" onClick={resetScanner} className="w-full">
                   <Scan className="w-4 h-4 mr-2"/> Scan Next
                 </Button>
               </div>)}
            
            {isPending && (<div className="absolute inset-0 bg-white/80 backdrop-blur flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary"/>
              </div>)}
          </CardContent>
        </Card>
      </main>
    </div>);
}
