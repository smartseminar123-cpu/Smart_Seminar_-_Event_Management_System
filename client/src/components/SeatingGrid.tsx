import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Registration } from "@shared/schema";

interface SeatingGridProps {
  rows: number;
  cols: number;
  registrations: Registration[];
  selectedSeat?: { row: number; col: number } | null;
  onSelectSeat?: (row: number, col: number) => void;
  readOnly?: boolean;
}

export function SeatingGrid({ 
  rows, 
  cols, 
  registrations, 
  selectedSeat, 
  onSelectSeat,
  readOnly = false 
}: SeatingGridProps) {
  // Map of "row-col" -> Registration
  const occupiedSeats = new Map(
    registrations.map(r => [`${r.seatRow}-${r.seatCol}`, r])
  );

  return (
    <div className="w-full overflow-x-auto p-4 border rounded-xl bg-slate-50">
      <div className="w-full text-center mb-6">
        <div className="w-3/4 h-2 bg-slate-300 mx-auto rounded-full mb-2" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Stage</span>
      </div>

      <div 
        className="seat-grid mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(40px, 1fr))` 
        }}
      >
        {Array.from({ length: rows }).map((_, r) => (
          Array.from({ length: cols }).map((_, c) => {
            const row = r + 1;
            const col = c + 1;
            const key = `${row}-${col}`;
            const isOccupied = occupiedSeats.has(key);
            const isSelected = selectedSeat?.row === row && selectedSeat?.col === col;

            return (
              <button
                key={key}
                disabled={readOnly || isOccupied}
                onClick={() => !readOnly && !isOccupied && onSelectSeat?.(row, col)}
                title={isOccupied ? `Occupied by ${occupiedSeats.get(key)?.studentName}` : `Row ${row} Seat ${col}`}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 border",
                  isOccupied 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300" 
                    : isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-white hover:border-primary hover:shadow-sm text-slate-600 border-slate-200"
                )}
              >
                {col}
              </button>
            );
          })
        ))}
      </div>

      <div className="flex justify-center gap-6 mt-8 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-slate-200" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300" />
          <span>Occupied</span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary border border-primary" />
            <span>Selected</span>
          </div>
        )}
      </div>
    </div>
  );
}
