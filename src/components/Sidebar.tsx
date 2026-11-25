import React from "react";
import {
  Search,
  Printer,
  Users,
  Hash,
  UserPen,
  FileSpreadsheet,
  History,
} from "lucide-react";

interface SidebarProps {
  cvRefNumber: string;
  onCvRefNumberChange: (val: string) => void;
  refNumber: string;
  onRefNumberChange: (val: string) => void;
  onSearchVoucher: () => void;
  isLoading: boolean;
  payeeOverride: string;
  onPayeeOverrideChange: (val: string) => void;
  onOpenSignatoriesModal: () => void;
  historyCount: number;
  onOpenHistoryModal: () => void;
  onPrint: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  cvRefNumber,
  onCvRefNumberChange,
  refNumber,
  onRefNumberChange,
  onSearchVoucher,
  isLoading,
  payeeOverride,
  onPayeeOverrideChange,
  onOpenSignatoriesModal,
  historyCount,
  onOpenHistoryModal,
  onPrint,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      onSearchVoucher();
    }
  };

  const adjustSeries = (delta: number) => {
    const trimmed = cvRefNumber.trim();
    const match = trimmed.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      const nextNum = Math.max(1, (parseInt(numStr, 10) || 1) + delta);
      const padded = String(nextNum).padStart(numStr.length, "0");
      onCvRefNumberChange(`${prefix}${padded}`);
    } else {
      const nextNum = Math.max(1, 1 + delta);
      onCvRefNumberChange(`CV${String(nextNum).padStart(3, "0")}`);
    }
  };

  return (
    <aside className="no-print w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-100 select-none shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <h1 className="font-bold text-base tracking-wide text-white">
          VoucherPRO
        </h1>
        <p className="text-xs text-slate-400">
          General Alliance For Skilled Professional, Inc.
        </p>
      </div>

      {/* Essential Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroller">
        {/* Active Form Banner */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-2">
          <div className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Check Voucher</span>
          </div>
        </div>

        {/* 1. CURRENT SERIES NUMBER / CV REF. NO. (Manual or +/- input, e.g. 26-111602) */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="sidebar-series-input"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
            >
              <Hash className="w-3.5 h-3.5 text-blue-400" />
              CV Ref. No. (Series)
            </label>
            {cvRefNumber && (
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded">
                {cvRefNumber}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              id="sidebar-series-input"
              name="series_number"
              type="text"
              value={cvRefNumber}
              onChange={(e) => onCvRefNumberChange(e.target.value)}
              placeholder="e.g. 26-111602"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => adjustSeries(-1)}
              className="w-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-bold text-slate-200 cursor-pointer"
              title="Decrement CV Ref. No."
            >
              -
            </button>
            <button
              type="button"
              onClick={() => adjustSeries(1)}
              className="w-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-bold text-slate-200 cursor-pointer"
              title="Increment CV Ref. No."
            >
              +
            </button>
          </div>
        </div>

        {/* 2. PAYEE OVERRIDE */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <label
            htmlFor="sidebar-payee-override"
            className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
          >
            <UserPen className="w-3.5 h-3.5 text-blue-400" />
            Payee :
          </label>
          <input
            id="sidebar-payee-override"
            name="payee_override"
            type="text"
            value={payeeOverride}
            onChange={(e) => onPayeeOverrideChange(e.target.value)}
            placeholder="Optional Payee Override"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 3. ENTER REFERENCE / TRANSACTION NUMBER */}
        <search>
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <label
              htmlFor="sidebar-ref-number"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              Enter Reference / Trans #
            </label>
            <input
              id="sidebar-ref-number"
              name="ref_number"
              type="search"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={refNumber}
              onChange={(e) => onRefNumberChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Check Ref # or Trans #"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              type="button"
              onClick={onSearchVoucher}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              {isLoading ? "Searching QuickBooks..." : "Search"}
            </button>
          </div>
        </search>

        {/* 4. SIGNATORY & PRINT HISTORY */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenSignatoriesModal}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Signatory</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistoryModal}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            title="View & reprint previously printed Check Vouchers"
          >
            <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {historyCount}
              </span>
            )}
          </button>
        </div>

        {/* 5. PRINT */}
        <button
          type="button"
          onClick={onPrint}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Check Voucher
        </button>
      </div>
    </aside>
  );
};
