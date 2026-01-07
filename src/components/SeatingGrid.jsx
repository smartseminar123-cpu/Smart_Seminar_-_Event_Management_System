import { cn } from "@/lib/utils";

// Helper to get row letter (1->A, 2->B, etc.)
export const getRowLabel = (index) => {
  return String.fromCharCode(65 + index - 1); // 1 -> A, 2 -> B
};

export function SeatingGrid({ rows, cols, registrations, selectedSeat, onSelectSeat, readOnly = false, rowConfig }) {
    // Map of "row-col" -> Registration
    const occupiedSeats = new Map(registrations.map(r => [`${r.seatRow}-${r.seatCol}`, r]));

    return (
      <div className="w-full bg-white p-6 rounded-lg border shadow-sm select-none">
        
        {/* Stage / Screen Indicator */}
        <div className="w-full mb-10 relative">
             <div className="w-3/4 mx-auto h-8 bg-gradient-to-b from-blue-50/80 to-transparent border-t-4 border-blue-200 rounded-t-[100%] flex items-center justify-center opacity-70">
                 <span className="text-[10px] text-blue-400 font-semibold tracking-[0.2em] uppercase mt-1">Screen This Way</span>
             </div>
        </div>

        {/* Pricing Info */}
        <div className="text-center mb-8">
             <span className="inline-block px-4 py-1.5 bg-white text-slate-600 text-xs font-medium rounded-full border border-slate-200 shadow-sm">
                Ticket Price: <span className="text-green-600 font-bold">₹0 (Free)</span>
             </span>
        </div>

        {/* Grid Container */}
        <div className="overflow-x-auto pb-4 flex w-full">
          <div className="flex flex-col gap-3 items-center m-auto min-w-max">
          {Array.from({ length: rows }).map((_, r) => {
             const rowNum = r + 1;
             const rowLabel = getRowLabel(rowNum);
             const seatsInRow = rowConfig ? (rowConfig[rowNum] || 0) : cols;
             
             return (
               <div key={rowNum} className="flex items-center gap-6 min-w-max">
                 {/* Row Label */}
                 <div className="w-4 text-right text-xs font-bold text-slate-400">
                    {rowLabel}
                 </div>

                 {/* Seats */}
                 <div className="flex gap-2">
                   {Array.from({ length: seatsInRow }).map((_, c) => {
                       const colNum = c + 1;
                       const key = `${rowNum}-${colNum}`;
                       const isOccupied = occupiedSeats.has(key);
                       const isSelected = selectedSeat?.row === rowNum && selectedSeat?.col === colNum;
                       
                       return (
                         <button
                           key={key}
                           disabled={readOnly || isOccupied}
                           onClick={() => !readOnly && !isOccupied && onSelectSeat?.(rowNum, colNum)}
                           title={isOccupied ? `Occupied by ${occupiedSeats.get(key)?.studentName}` : `${rowLabel}${colNum}`}
                           className={cn(
                             "w-8 h-8 rounded-[4px] text-[10px] font-medium transition-all duration-200 flex items-center justify-center border",
                             isOccupied
                               ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed" // Sold
                               : isSelected
                                 ? "bg-green-500 text-white border-green-600 shadow-sm" // Selected
                                 : "bg-white text-green-600 border-green-500 hover:bg-green-50 hover:shadow-sm" // Available
                           )}
                         >
                           {colNum}
                         </button>
                       );
                   })}
                 </div>
               </div>
             );
          })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8 border-t pt-6">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[2px] border border-green-500 bg-white"></div>
                <span className="text-xs text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[2px] border border-green-600 bg-green-500"></div>
                <span className="text-xs text-slate-600">Selected</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[2px] border border-slate-200 bg-slate-100"></div>
                <span className="text-xs text-slate-600">Sold</span>
            </div>
        </div>
      </div>
    );
}
