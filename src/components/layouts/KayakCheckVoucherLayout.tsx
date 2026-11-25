import React, { useRef, useState } from "react";
import {
  BradwellFieldKey,
  ClientProfile,
  FieldOffset,
  VoucherData,
  VoucherLineItem,
} from "../../types/voucher";

interface Props {
  data: VoucherData;
  client: ClientProfile;
  payeeOverride: string;
  showWireframeGuide: boolean;
  showCompanyHeader?: boolean;
  calibrationMode: boolean;
  selectedField: BradwellFieldKey | null;
  onSelectField: (field: BradwellFieldKey | null) => void;
  onUpdateFieldOffset: (field: BradwellFieldKey, next: FieldOffset) => void;
}

export interface KayakFieldAnchor {
  key: BradwellFieldKey;
  label: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn?: number;
  defaultFontPt: number;
  align?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
}

export type KayakCvFieldKey =
  | "company_header"
  | "cv_number"
  | "payee_name"
  | "bank_name"
  | "check_no"
  | "check_date"
  | "amount_in_words"
  | "top_amount"
  | "particulars"
  | "distribution_table"
  | "prepared_by"
  | "checked_by"
  | "approved_by"
  | "received_by";

/**
 * Exact anchor coordinates (in inches on an 8.5" x 11.0" Letter page)
 * matching the Kayak Construction Corp. Check Voucher layout (CRCV_KAYAK / CRCV_CPIBILL).
 */
export const KAYAK_FIELD_ANCHORS: Record<KayakCvFieldKey, KayakFieldAnchor> = {
  company_header: {
    key: "company_header",
    label: "Company Header (General Alliance For Skilled Professional, Inc.)",
    xIn: 0.58,
    yIn: 0.36,
    widthIn: 5.8,
    defaultFontPt: 15.5,
    fontWeight: "normal",
  },
  cv_number: {
    key: "cv_number",
    label: "CV Ref. No.",
    xIn: 6.08,
    yIn: 1.11,
    widthIn: 1.833,
    defaultFontPt: 10,
    align: "center",
    fontWeight: "normal",
  },
  payee_name: {
    key: "payee_name",
    label: "Payee",
    xIn: 0.64,
    yIn: 1.61,
    widthIn: 2.22,
    defaultFontPt: 9.5,
    align: "left",
    fontWeight: "normal",
  },
  bank_name: {
    key: "bank_name",
    label: "Bank",
    xIn: 2.95,
    yIn: 1.57,
    widthIn: 1.6,
    defaultFontPt: 9,
    align: "center",
    fontWeight: "normal",
  },
  check_no: {
    key: "check_no",
    label: "Check Number",
    xIn: 4.62,
    yIn: 1.61,
    widthIn: 1.42,
    defaultFontPt: 9.5,
    align: "center",
    fontWeight: "normal",
  },
  check_date: {
    key: "check_date",
    label: "Check Date (dd-MMM-yyyy)",
    xIn: 6.12,
    yIn: 1.61,
    widthIn: 1.75,
    defaultFontPt: 9.5,
    align: "center",
    fontWeight: "normal",
  },
  amount_in_words: {
    key: "amount_in_words",
    label: "Amount in Words",
    xIn: 0.72,
    yIn: 2.1,
    widthIn: 5.3,
    defaultFontPt: 9.5,
    align: "left",
    fontWeight: "normal",
  },
  top_amount: {
    key: "top_amount",
    label: "Amount",
    xIn: 6.26,
    yIn: 2.1,
    widthIn: 1.58,
    defaultFontPt: 9.5,
    align: "right",
    fontWeight: "normal",
  },
  particulars: {
    key: "particulars",
    label: "PARTICULARS (Remarks / Memo)",
    xIn: 0.64,
    yIn: 2.68,
    widthIn: 7.21,
    defaultFontPt: 9.5,
    align: "center",
    fontWeight: "normal",
  },
  distribution_table: {
    key: "distribution_table",
    label: "Account Code / Name | Class | Debit | Credit Table",
    xIn: 0.58,
    yIn: 3.5,
    widthIn: 7.333,
    defaultFontPt: 9.5,
    fontWeight: "normal",
  },
  prepared_by: {
    key: "prepared_by",
    label: "Prepared By (Name & Position)",
    xIn: 0.58,
    yIn: 6.95,
    widthIn: 1.833,
    defaultFontPt: 9.5,
    align: "center",
    fontWeight: "normal",
  },
  checked_by: {
    key: "checked_by",
    label: "Checked By (Name & Position)",
    xIn: 2.413,
    yIn: 6.95,
    widthIn: 1.833,
    defaultFontPt: 9.5,
    align: "center",
    fontWeight: "normal",
  },
  approved_by: {
    key: "approved_by",
    label: "Approved By (Name & Position)",
    xIn: 4.246,
    yIn: 6.95,
    widthIn: 1.833,
    defaultFontPt: 9.5,
    align: "center",
    fontWeight: "normal",
  },
  received_by: {
    key: "received_by",
    label: "Received By (Name & Position)",
    xIn: 6.08,
    yIn: 6.95,
    widthIn: 1.833,
    defaultFontPt: 9.5,
    align: "center",
    fontWeight: "normal",
  },
};

const formatCurrency = (val: number) => {
  if (!val || Math.abs(val) < 0.001) return "";
  return val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCurrencyAlways = (val: number) => {
  return (val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Formats date as dd-MMM-yyyy (e.g. "18-Nov-2026")
 */
const formatKayakDate = (rawDate: string): string => {
  if (!rawDate) return "";
  const trimmed = rawDate.trim();
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      const y = parts[2];
      if (m >= 1 && m <= 12 && !isNaN(d)) {
        return `${String(d).padStart(2, "0")}-${MONTH_NAMES[m - 1]}-${y}`;
      }
    }
  }
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (m >= 1 && m <= 12 && !isNaN(d)) {
        return `${String(d).padStart(2, "0")}-${MONTH_NAMES[m - 1]}-${y}`;
      }
    }
  }
  const dt = new Date(trimmed);
  if (!isNaN(dt.getTime())) {
    const d = String(dt.getDate()).padStart(2, "0");
    const m = MONTH_NAMES[dt.getMonth()];
    const y = dt.getFullYear();
    return `${d}-${m}-${y}`;
  }
  return trimmed;
};

export const KayakCheckVoucherLayout: React.FC<Props> = ({
  data,
  client,
  payeeOverride,
  showWireframeGuide,
  showCompanyHeader = true,
  calibrationMode,
  selectedField,
  onSelectField,
  onUpdateFieldOffset,
}) => {
  const cfg = client.layout_config;
  const globalXmm = cfg.preprinted_x_offset_mm ?? 0;
  const globalYmm = cfg.preprinted_y_offset_mm ?? 0;
  const fieldOffsets = cfg.field_offsets ?? {};

  const dragRef = useRef<{
    key: BradwellFieldKey;
    startClientX: number;
    startClientY: number;
    initialXmm: number;
    initialYmm: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getFieldOffset = (key: BradwellFieldKey): FieldOffset => {
    return fieldOffsets[key] ?? { x_mm: 0, y_mm: 0, font_size_pt: null };
  };

  const getOffsetStyle = (
    key: KayakCvFieldKey,
    baseXIn: number,
    baseYIn: number,
    widthIn: number,
    defaultFontPt: number,
    align: "left" | "center" | "right" = "left",
    fontWeight: "normal" | "bold" = "normal"
  ): React.CSSProperties => {
    const fOff = getFieldOffset(key);
    const totalXmm = globalXmm + (fOff.x_mm || 0);
    const totalYmm = globalYmm + (fOff.y_mm || 0);
    const fontPt = fOff.font_size_pt ?? defaultFontPt;

    return {
      position: "absolute",
      left: `calc(${baseXIn}in + ${totalXmm}mm)`,
      top: `calc(${baseYIn}in + ${totalYmm}mm)`,
      width: `${widthIn}in`,
      fontSize: `${fontPt}pt`,
      fontWeight,
      textAlign: align,
      lineHeight: 1.2,
      color: "#000000",
      fontFamily: "Arial, Helvetica, sans-serif",
      zIndex: selectedField === key ? 30 : 20,
      userSelect: calibrationMode ? "none" : "auto",
      cursor: calibrationMode ? "move" : "default",
    };
  };

  const handleMouseDownField = (e: React.MouseEvent, key: BradwellFieldKey) => {
    if (!calibrationMode) return;
    e.stopPropagation();
    onSelectField(key);
    const current = getFieldOffset(key);
    dragRef.current = {
      key,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialXmm: current.x_mm || 0,
      initialYmm: current.y_mm || 0,
    };
    setIsDragging(true);
  };

  const handleMouseMovePage = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dxMm = ((e.clientX - dragRef.current.startClientX) * 25.4) / 96.0;
    const dyMm = ((e.clientY - dragRef.current.startClientY) * 25.4) / 96.0;
    const nextX = Math.round((dragRef.current.initialXmm + dxMm) * 2) / 2;
    const nextY = Math.round((dragRef.current.initialYmm + dyMm) * 2) / 2;
    const current = getFieldOffset(dragRef.current.key);
    onUpdateFieldOffset(dragRef.current.key, {
      ...current,
      x_mm: nextX,
      y_mm: nextY,
    });
  };

  const handleMouseUpPage = () => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current = null;
    }
  };

  const fieldCalibrationClass = (key: BradwellFieldKey) => {
    if (!calibrationMode) return "data-field-node";
    const isSel = selectedField === key;
    return `data-field-node rounded-xs transition-shadow ${
      isSel
        ? "outline-2 outline-blue-600 bg-blue-500/15 shadow-xs"
        : "outline-1 outline-dashed outline-amber-500/80 hover:bg-amber-500/10"
    }`;
  };

  const displayPayee = payeeOverride || data.payee_name;
  const displayCheckDate = formatKayakDate(data.date);
  const displayTotalAmount = formatCurrencyAlways(data.total_amount);
  const particularMemo = data.memo || "";

  // Separate distribution rows from the trailing Bank / Payable credit line
  const allItems = data.line_items || [];
  let distributionLines: VoucherLineItem[] = [];
  let bankCreditLine: VoucherLineItem | null = null;

  if (allItems.length > 0) {
    const last = allItems[allItems.length - 1];
    const isLastBankCredit =
      last.credit > 0 &&
      last.debit === 0 &&
      (Math.abs(last.credit - data.total_amount) < 0.01 ||
        (data.bank_account &&
          last.account_name.toLowerCase() === data.bank_account.toLowerCase()));

    if (isLastBankCredit) {
      distributionLines = allItems.slice(0, -1);
      bankCreditLine = last;
    } else {
      distributionLines = allItems;
    }
  }

  // Exact Kayak Crystal Report (CRCV_KAYAK / CRCV_CPIBILL) dimensions in inches (1440 twips = 1.00in)
  // Left margin = 0.58in, Total Table Width = 7.333in (10560 twips)
  const leftXIn = 0.58;
  const totalWidthIn = 7.333;

  // 2nd Table Column Widths:
  // Col 1 (ACCOUNT CODE / NAME): 2715 twips = 1.885in
  // Col 2 (CLASS): 4635 twips = 3.219in
  // Col 3 (DEBIT): 1635 twips = 1.135in
  // Col 4 (CREDIT): 1575 twips = 1.094in
  const col1WIn = 1.885;
  const col2WIn = 3.219;
  const col3WIn = 1.135;
  const col4WIn = 1.094;

  const col2XIn = col1WIn; // 1.885in
  const col3XIn = col1WIn + col2WIn; // 5.104in
  const col4XIn = col1WIn + col2WIn + col3WIn; // 6.239in

  const tableHeaderTopIn = 3.22;
  const tableHeaderHIn = 0.25;
  const tableBodyTopIn = tableHeaderTopIn + tableHeaderHIn; // 3.47in

  const perRowHIn = 0.42;
  const payableRowHIn = 0.48;
  const minBodyHIn = 1.55;

  // Pagination: fit up to 11 rows per page (leaves room on the page for signatories/totals at the bottom)
  // On the last page, the trailing Bank/Payable credit row also sits inside the table body, so max 10 distribution rows + 1 bank credit row
  const MAX_DIST_ROWS_INTERMEDIATE_PAGE = 11;
  const MAX_DIST_ROWS_FINAL_PAGE = 10;

  const pageChunks: VoucherLineItem[][] = [];
  if (distributionLines.length <= MAX_DIST_ROWS_FINAL_PAGE) {
    pageChunks.push(distributionLines);
  } else {
    let remaining = [...distributionLines];
    while (remaining.length > 0) {
      if (remaining.length <= MAX_DIST_ROWS_FINAL_PAGE) {
        pageChunks.push(remaining);
        break;
      } else if (remaining.length <= MAX_DIST_ROWS_INTERMEDIATE_PAGE) {
        // Put 10 on this page and carry remaining to the final page alongside the bank credit row
        pageChunks.push(remaining.slice(0, MAX_DIST_ROWS_FINAL_PAGE));
        remaining = remaining.slice(MAX_DIST_ROWS_FINAL_PAGE);
      } else {
        pageChunks.push(remaining.slice(0, MAX_DIST_ROWS_INTERMEDIATE_PAGE));
        remaining = remaining.slice(MAX_DIST_ROWS_INTERMEDIATE_PAGE);
      }
    }
  }
  const totalPages = pageChunks.length;

  // Totals calculation
  let debitTotalAmount = 0;
  let creditTotalAmount = 0;
  for (const item of distributionLines) {
    if (item.debit > 0) debitTotalAmount += item.debit;
    if (item.credit > 0) creditTotalAmount += item.credit;
  }
  const bankCreditAmount = bankCreditLine
    ? bankCreditLine.credit
    : debitTotalAmount > 0
    ? debitTotalAmount
    : data.total_amount;
  creditTotalAmount += bankCreditAmount;
  if (debitTotalAmount === 0 && data.total_amount > 0) {
    debitTotalAmount = data.total_amount;
  }

  // Format bottom payable/bank credit line: "{accNumber} - {bankName}"
  const payableAccNum = (bankCreditLine?.account_number || "")
    .trim()
    .replace(/-+$/, "");
  const payableBankName = (
    bankCreditLine?.account_name ||
    data.bank_account ||
    ""
  )
    .trim()
    .replace(/^-+/, "");
  const payableAccountText = [payableAccNum, payableBankName]
    .filter(Boolean)
    .join(" - ");

  const signWidthIn = totalWidthIn / 4; // 1.83325in per signatory box
  const signHeaderHIn = 0.24;
  const signBodyHIn = 0.88;

  // Signatories (Prepared By, Checked By, Approved By, Received By)
  const sig = data.signatories;
  const preparedByName = sig.prepared_by_name;
  const preparedByPos = sig.prepared_by_pos;
  const checkedByName = sig.checked_by_name || sig.reviewed_by_name;
  const checkedByPos = sig.checked_by_pos || sig.reviewed_by_pos;
  const approvedByName = sig.approved_by_name;
  const approvedByPos = sig.approved_by_pos;
  const receivedByName = sig.received_by_name;
  const receivedByPos = sig.received_by_pos;

  const distOff = getFieldOffset("distribution_table");
  const distXmm = globalXmm + (distOff.x_mm || 0);
  const distYmm = globalYmm + (distOff.y_mm || 0);
  const distFontPt = distOff.font_size_pt ?? 9.5;

  return (
    <div className="voucher-pages-container flex flex-col items-center gap-8">
      {pageChunks.map((pageDistLines, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1;
        const continuationNoteHIn = !isLastPage ? 0.32 : 0;
        const calculatedBodyHIn = Math.max(
          minBodyHIn,
          pageDistLines.length * perRowHIn +
            (isLastPage ? payableRowHIn : continuationNoteHIn) +
            0.15
        );
        const tableBottomYIn = tableBodyTopIn + calculatedBodyHIn;
        const payableRowTopIn = calculatedBodyHIn - payableRowHIn;
        const totalsTopIn = tableBottomYIn + 0.18;
        const signTopIn = tableBottomYIn + 0.56;

        return (
          <div
            key={pageIdx}
            className="voucher-page relative bg-white text-black shadow-2xl mx-auto select-text"
            style={{
              width: "8.5in",
              minWidth: "8.5in",
              maxWidth: "8.5in",
              height: "11in",
              minHeight: "11in",
              maxHeight: "11in",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
            onMouseMove={handleMouseMovePage}
            onMouseUp={handleMouseUpPage}
            onMouseLeave={handleMouseUpPage}
            onClick={() => {
              if (calibrationMode) onSelectField(null);
            }}
          >
            {/* Multi-page indicator (only shown when voucher spans 2+ pages) */}
            {totalPages > 1 && (
              <div
                style={{
                  position: "absolute",
                  left: "6.08in",
                  top: "0.70in",
                  width: "1.833in",
                  textAlign: "right",
                  fontSize: "8.5pt",
                  fontWeight: 400,
                  color: "#000000",
                  zIndex: 25,
                }}
              >
                Page {pageIdx + 1} of {totalPages}
              </div>
            )}

            {/* KAYAK FORM WIREFRAME STRUCTURE (Matching Kayak sample layout) */}
            {showWireframeGuide && (
              <div
                className="pointer-events-none select-none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "8.5in",
                  height: "11in",
                  zIndex: 1,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: "#000000",
                }}
              >
                {/* "CHECK VOUCHER" Title immediately left of CV Ref. No. box */}
                <div
                  style={{
                    position: "absolute",
                    left: "4.15in",
                    top: "1.12in",
                    width: "1.88in",
                    textAlign: "center",
                    fontSize: "13.5pt",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                  }}
                >
                  CHECK VOUCHER
                </div>

                {/* Top-Right CV Ref. No. Box sitting directly above Check Date */}
                <div
                  style={{
                    position: "absolute",
                    left: "6.08in",
                    top: "0.90in",
                    width: "1.833in",
                    height: "0.50in",
                    border: "1px solid #000000",
                    borderBottom: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "0.05in",
                      top: "0.03in",
                      fontSize: "9pt",
                      fontWeight: 400,
                    }}
                  >
                    CV Ref. No.
                  </div>
                </div>

                {/* 1st Table - Header Details Grid (Payee | Bank | Check Number | Check Date / Amount in Words | Amount) */}
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn}in`,
                    top: "1.40in",
                    width: `${totalWidthIn}in`,
                    height: "0.92in",
                    border: "1px solid #000000",
                  }}
                >
                  {/* Horizontal divider between Row 1 (0.50in) and Row 2 (0.42in) */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "0.50in",
                      borderBottom: "1px solid #000000",
                    }}
                  />

                  {/* Vertical divider between Payee (2.333in) and Bank */}
                  <div
                    style={{
                      position: "absolute",
                      left: "2.333in",
                      top: 0,
                      height: "0.50in",
                      borderLeft: "1px solid #000000",
                    }}
                  />

                  {/* Vertical divider between Bank (2.333 + 1.667 = 4.00in) and Check Number */}
                  <div
                    style={{
                      position: "absolute",
                      left: "4.00in",
                      top: 0,
                      height: "0.50in",
                      borderLeft: "1px solid #000000",
                    }}
                  />

                  {/* Vertical divider between Check Number / Amount in Words (5.50in) and Check Date / Amount */}
                  <div
                    style={{
                      position: "absolute",
                      left: "5.50in",
                      top: 0,
                      bottom: 0,
                      borderLeft: "1px solid #000000",
                    }}
                  />

                  {/* Field Labels */}
                  <span
                    style={{
                      position: "absolute",
                      left: "0.05in",
                      top: "0.02in",
                      fontSize: "9pt",
                    }}
                  >
                    Payee
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: "2.38in",
                      top: "0.02in",
                      fontSize: "9pt",
                    }}
                  >
                    Bank
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: "4.05in",
                      top: "0.02in",
                      fontSize: "9pt",
                    }}
                  >
                    Check Number
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: "5.55in",
                      top: "0.02in",
                      fontSize: "9pt",
                    }}
                  >
                    Check Date
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: "0.05in",
                      top: "0.52in",
                      fontSize: "9pt",
                    }}
                  >
                    Amount in Words
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: "5.55in",
                      top: "0.52in",
                      fontSize: "9pt",
                    }}
                  >
                    Amount
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: "5.58in",
                      top: "0.70in",
                      fontSize: "9pt",
                      fontWeight: 700,
                    }}
                  >
                    ₱
                  </span>
                </div>

                {/* PARTICULARS Box (Separate full-width bordered box below 1st Table) */}
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn}in`,
                    top: "2.44in",
                    width: `${totalWidthIn}in`,
                    height: "0.66in",
                    border: "1px solid #000000",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      height: "0.23in",
                      borderBottom: "1px solid #000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9.5pt",
                      fontWeight: 700,
                    }}
                  >
                    PARTICULARS
                  </div>
                </div>

                {/* 2nd Table Header Bar: ACCOUNT CODE / NAME | CLASS | DEBIT | CREDIT */}
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn}in`,
                    top: `${tableHeaderTopIn}in`,
                    width: `${totalWidthIn}in`,
                    height: `${tableHeaderHIn}in`,
                    border: "1px solid #000000",
                    fontSize: "9.5pt",
                    fontWeight: 700,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${col1WIn}in`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ACCOUNT CODE / NAME
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: `${col2XIn}in`,
                      top: 0,
                      bottom: 0,
                      width: `${col2WIn}in`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    CLASS
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: `${col3XIn}in`,
                      top: 0,
                      bottom: 0,
                      width: `${col3WIn}in`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    DEBIT
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: `${col4XIn}in`,
                      top: 0,
                      bottom: 0,
                      width: `${col4WIn}in`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    CREDIT
                  </div>
                </div>

                {/* 2nd Table Vertical Column Divider Lines (extending from header top to bottom horizontal line) */}
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn + col2XIn}in`,
                    top: `${tableHeaderTopIn}in`,
                    height: `${tableBottomYIn - tableHeaderTopIn}in`,
                    borderLeft: "1px solid #000000",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn + col3XIn}in`,
                    top: `${tableHeaderTopIn}in`,
                    height: `${tableBottomYIn - tableHeaderTopIn}in`,
                    borderLeft: "1px solid #000000",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn + col4XIn}in`,
                    top: `${tableHeaderTopIn}in`,
                    height: `${tableBottomYIn - tableHeaderTopIn}in`,
                    borderLeft: "1px solid #000000",
                  }}
                />

                {/* 2nd Table Bottom Horizontal Closing Line */}
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn}in`,
                    top: `${tableBottomYIn}in`,
                    width: `${totalWidthIn}in`,
                    borderBottom: "1px solid #000000",
                  }}
                />

                {/* Debit & Credit Double Underlines (Only on Final Page) */}
                {isLastPage && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: `${leftXIn + col3XIn + 0.05}in`,
                        top: `${totalsTopIn + 0.21}in`,
                        width: `${col3WIn - 0.08}in`,
                        borderBottom: "1px solid #000000",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${leftXIn + col3XIn + 0.05}in`,
                        top: `${totalsTopIn + 0.24}in`,
                        width: `${col3WIn - 0.08}in`,
                        borderBottom: "1px solid #000000",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${leftXIn + col4XIn + 0.08}in`,
                        top: `${totalsTopIn + 0.21}in`,
                        width: `${col4WIn - 0.08}in`,
                        borderBottom: "1px solid #000000",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${leftXIn + col4XIn + 0.08}in`,
                        top: `${totalsTopIn + 0.24}in`,
                        width: `${col4WIn - 0.08}in`,
                        borderBottom: "1px solid #000000",
                      }}
                    />
                  </>
                )}

                {/* 4-Column Signatories Box (Prepared By: | Checked By: | Approved By: | Received By:) */}
                <div
                  style={{
                    position: "absolute",
                    left: `${leftXIn}in`,
                    top: `${signTopIn}in`,
                    width: `${totalWidthIn}in`,
                    height: `${signHeaderHIn + signBodyHIn}in`,
                    border: "1px solid #000000",
                  }}
                >
                  {/* Horizontal line below signatory labels */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${signHeaderHIn}in`,
                      borderBottom: "1px solid #000000",
                    }}
                  />

                  {/* 3 Vertical column dividers */}
                  {[1, 2, 3].map((colIdx) => (
                    <div
                      key={colIdx}
                      style={{
                        position: "absolute",
                        left: `${colIdx * signWidthIn}in`,
                        top: 0,
                        bottom: 0,
                        borderLeft: "1px solid #000000",
                      }}
                    />
                  ))}

                  {/* Column headers */}
                  {(
                    [
                      "Prepared By:",
                      "Checked By:",
                      "Approved By:",
                      "Received By:",
                    ] as const
                  ).map((label, idx) => (
                    <div
                      key={label}
                      style={{
                        position: "absolute",
                        left: `${idx * signWidthIn}in`,
                        top: 0,
                        width: `${signWidthIn}in`,
                        height: `${signHeaderHIn}in`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9.5pt",
                        fontWeight: 400,
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPANY HEADER: General Alliance For Skilled Professional, Inc. */}
            {showCompanyHeader && (
              <div
                className={fieldCalibrationClass("company_header")}
                style={getOffsetStyle(
                  "company_header",
                  KAYAK_FIELD_ANCHORS.company_header.xIn,
                  KAYAK_FIELD_ANCHORS.company_header.yIn,
                  KAYAK_FIELD_ANCHORS.company_header.widthIn,
                  KAYAK_FIELD_ANCHORS.company_header.defaultFontPt,
                  "left",
                  "normal"
                )}
                onMouseDown={(e) => handleMouseDownField(e, "company_header")}
                title="Drag to adjust Company Header position"
              >
                <div style={{ lineHeight: 1.15 }}>
                  General Alliance For Skilled Professional, Inc.
                </div>
                <div
                  style={{
                    fontSize: "9.5pt",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    marginTop: "4px",
                  }}
                >
                  100 Naval St. Dolores 1920 Taytay Rizal Philippines
                </div>
              </div>
            )}

            {/* CV REF. NO. */}
            <div
              className={fieldCalibrationClass("cv_number")}
              style={getOffsetStyle(
                "cv_number",
                KAYAK_FIELD_ANCHORS.cv_number.xIn,
                KAYAK_FIELD_ANCHORS.cv_number.yIn,
                KAYAK_FIELD_ANCHORS.cv_number.widthIn,
                KAYAK_FIELD_ANCHORS.cv_number.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "cv_number")}
              title="Drag to adjust CV Ref. No. position"
            >
              <div className="truncate">{data.series_number}</div>
            </div>

            {/* PAYEE */}
            <div
              className={fieldCalibrationClass("payee_name")}
              style={getOffsetStyle(
                "payee_name",
                KAYAK_FIELD_ANCHORS.payee_name.xIn,
                KAYAK_FIELD_ANCHORS.payee_name.yIn,
                KAYAK_FIELD_ANCHORS.payee_name.widthIn,
                KAYAK_FIELD_ANCHORS.payee_name.defaultFontPt,
                "left",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "payee_name")}
              title="Drag to adjust Payee position"
            >
              <div className="truncate">{displayPayee}</div>
            </div>

            {/* BANK */}
            <div
              className={fieldCalibrationClass("bank_name")}
              style={getOffsetStyle(
                "bank_name",
                KAYAK_FIELD_ANCHORS.bank_name.xIn,
                KAYAK_FIELD_ANCHORS.bank_name.yIn,
                KAYAK_FIELD_ANCHORS.bank_name.widthIn,
                KAYAK_FIELD_ANCHORS.bank_name.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "bank_name")}
              title="Drag to adjust Bank position"
            >
              <div className="line-clamp-2 leading-tight break-words">
                {data.bank_account}
              </div>
            </div>

            {/* CHECK NUMBER */}
            <div
              className={fieldCalibrationClass("check_no")}
              style={getOffsetStyle(
                "check_no",
                KAYAK_FIELD_ANCHORS.check_no.xIn,
                KAYAK_FIELD_ANCHORS.check_no.yIn,
                KAYAK_FIELD_ANCHORS.check_no.widthIn,
                KAYAK_FIELD_ANCHORS.check_no.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "check_no")}
              title="Drag to adjust Check Number position"
            >
              <div className="truncate">{data.ref_number}</div>
            </div>

            {/* CHECK DATE */}
            <div
              className={fieldCalibrationClass("check_date")}
              style={getOffsetStyle(
                "check_date",
                KAYAK_FIELD_ANCHORS.check_date.xIn,
                KAYAK_FIELD_ANCHORS.check_date.yIn,
                KAYAK_FIELD_ANCHORS.check_date.widthIn,
                KAYAK_FIELD_ANCHORS.check_date.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "check_date")}
              title="Drag to adjust Check Date position"
            >
              <div className="truncate">{displayCheckDate}</div>
            </div>

            {/* AMOUNT IN WORDS */}
            <div
              className={fieldCalibrationClass("amount_in_words")}
              style={getOffsetStyle(
                "amount_in_words",
                KAYAK_FIELD_ANCHORS.amount_in_words.xIn,
                KAYAK_FIELD_ANCHORS.amount_in_words.yIn,
                KAYAK_FIELD_ANCHORS.amount_in_words.widthIn,
                KAYAK_FIELD_ANCHORS.amount_in_words.defaultFontPt,
                "left",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "amount_in_words")}
              title="Drag to adjust Amount in Words position"
            >
              <div className="truncate">{data.amount_in_words}</div>
            </div>

            {/* AMOUNT */}
            <div
              className={fieldCalibrationClass("top_amount")}
              style={getOffsetStyle(
                "top_amount",
                KAYAK_FIELD_ANCHORS.top_amount.xIn,
                KAYAK_FIELD_ANCHORS.top_amount.yIn,
                KAYAK_FIELD_ANCHORS.top_amount.widthIn,
                KAYAK_FIELD_ANCHORS.top_amount.defaultFontPt,
                "right",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "top_amount")}
              title="Drag to adjust Amount position"
            >
              {displayTotalAmount}
            </div>

            {/* PARTICULARS (MEMO / REMARKS) inside the PARTICULARS Box */}
            <div
              className={fieldCalibrationClass("particulars")}
              style={{
                ...getOffsetStyle(
                  "particulars",
                  KAYAK_FIELD_ANCHORS.particulars.xIn,
                  KAYAK_FIELD_ANCHORS.particulars.yIn,
                  KAYAK_FIELD_ANCHORS.particulars.widthIn,
                  KAYAK_FIELD_ANCHORS.particulars.defaultFontPt,
                  "center",
                  "normal"
                ),
                height: "0.40in",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseDown={(e) => handleMouseDownField(e, "particulars")}
              title="Drag to adjust Particulars / Remarks position"
            >
              <div className="whitespace-pre-wrap break-words leading-snug text-center line-clamp-2">
                {particularMemo}
              </div>
            </div>

            {/* 2ND TABLE DATA: ACCOUNT CODE / NAME | CLASS | DEBIT | CREDIT & TOTALS */}
            <div
              className={fieldCalibrationClass("distribution_table")}
              style={{
                position: "absolute",
                left: `calc(${leftXIn}in + ${distXmm}mm)`,
                top: `calc(${tableBodyTopIn}in + ${distYmm}mm)`,
                width: `${totalWidthIn}in`,
                fontSize: `${distFontPt}pt`,
                color: "#000000",
                zIndex: selectedField === "distribution_table" ? 30 : 20,
                userSelect: calibrationMode ? "none" : "auto",
                cursor: calibrationMode ? "move" : "default",
              }}
              onMouseDown={(e) => handleMouseDownField(e, "distribution_table")}
              title="Drag to adjust Account Code / Name, Class, Debit & Credit rows"
            >
              {/* Expense & Item Distribution Rows for this page */}
              {pageDistLines.map((item, idx) => {
                const accNum = (item.account_number || "")
                  .trim()
                  .replace(/-+$/, "");
                const accName = (item.account_name || "")
                  .trim()
                  .replace(/^-+/, "");
                const accountText = [accNum, accName]
                  .filter(Boolean)
                  .join(" - ");
                const rowTopIn = 0.04 + idx * perRowHIn;

                return (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: `${rowTopIn}in`,
                      width: `${totalWidthIn}in`,
                      height: `${perRowHIn}in`,
                    }}
                  >
                    {/* Col 1: ACCOUNT CODE / NAME */}
                    <div
                      className="line-clamp-2 break-words leading-tight"
                      style={{
                        position: "absolute",
                        left: "0.02in",
                        width: `${col1WIn - 0.06}in`,
                        textAlign: "left",
                      }}
                    >
                      {accountText}
                    </div>

                    {/* Col 2: CLASS */}
                    <div
                      className="line-clamp-2 break-words leading-tight"
                      style={{
                        position: "absolute",
                        left: `${col2XIn + 0.04}in`,
                        width: `${col2WIn - 0.08}in`,
                        textAlign: "left",
                      }}
                    >
                      {item.class_name}
                    </div>

                    {/* Col 3: DEBIT */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${col3XIn}in`,
                        width: `${col3WIn - 0.04}in`,
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(item.debit)}
                    </div>

                    {/* Col 4: CREDIT */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${col4XIn}in`,
                        width: `${col4WIn - 0.04}in`,
                        textAlign: "right",
                      }}
                    >
                      {formatCurrency(item.credit)}
                    </div>
                  </div>
                );
              })}

              {/* Continuation Notice on non-final pages vs. Bank Credit Row & Totals on final page */}
              {!isLastPage ? (
                <div
                  style={{
                    position: "absolute",
                    left: `${col2XIn + 0.04}in`,
                    top: `${calculatedBodyHIn - 0.28}in`,
                    width: `${col2WIn - 0.08}in`,
                    textAlign: "center",
                    fontStyle: "italic",
                    fontSize: "8.5pt",
                  }}
                >
                  (Continued on Page {pageIdx + 2}...)
                </div>
              ) : (
                <>
                  {/* Payable / Bank Account Credit Row at the bottom of the 2nd Table */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: `${payableRowTopIn}in`,
                      width: `${totalWidthIn}in`,
                      height: `${payableRowHIn}in`,
                    }}
                  >
                    <div
                      className="line-clamp-2 break-words leading-tight"
                      style={{
                        position: "absolute",
                        left: "0.02in",
                        width: `${col1WIn - 0.06}in`,
                        textAlign: "left",
                      }}
                    >
                      {payableAccountText}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: `${col4XIn}in`,
                        width: `${col4WIn - 0.04}in`,
                        textAlign: "right",
                      }}
                    >
                      {formatCurrencyAlways(bankCreditAmount)}
                    </div>
                  </div>

                  {/* Debit & Credit Totals below the 2nd Table bottom horizontal line */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: `${totalsTopIn - tableBodyTopIn}in`,
                      width: `${totalWidthIn}in`,
                    }}
                  >
                    {/* Debit Total */}
                    <span
                      style={{
                        position: "absolute",
                        left: `${col3XIn}in`,
                        width: `${col3WIn - 0.04}in`,
                        textAlign: "right",
                      }}
                    >
                      {formatCurrencyAlways(debitTotalAmount)}
                    </span>

                    {/* Credit Total */}
                    <span
                      style={{
                        position: "absolute",
                        left: `${col4XIn}in`,
                        width: `${col4WIn - 0.04}in`,
                        textAlign: "right",
                      }}
                    >
                      {formatCurrencyAlways(creditTotalAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* 4 SIGNATORIES: Prepared By, Checked By, Approved By, Received By (Name + Position) */}
            {/* 1. Prepared By */}
            <div
              className={fieldCalibrationClass("prepared_by")}
              style={getOffsetStyle(
                "prepared_by",
                leftXIn,
                signTopIn + signHeaderHIn + 0.44,
                signWidthIn,
                KAYAK_FIELD_ANCHORS.prepared_by.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "prepared_by")}
              title="Drag to adjust Prepared By position"
            >
              <div className="truncate">{preparedByName}</div>
              <div className="truncate" style={{ marginTop: "2px" }}>
                {preparedByPos}
              </div>
            </div>

            {/* 2. Checked By */}
            <div
              className={fieldCalibrationClass("checked_by")}
              style={getOffsetStyle(
                "checked_by",
                leftXIn + signWidthIn,
                signTopIn + signHeaderHIn + 0.44,
                signWidthIn,
                KAYAK_FIELD_ANCHORS.checked_by.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "checked_by")}
              title="Drag to adjust Checked By position"
            >
              <div className="truncate">{checkedByName}</div>
              <div className="truncate" style={{ marginTop: "2px" }}>
                {checkedByPos}
              </div>
            </div>

            {/* 3. Approved By */}
            <div
              className={fieldCalibrationClass("approved_by")}
              style={getOffsetStyle(
                "approved_by",
                leftXIn + signWidthIn * 2,
                signTopIn + signHeaderHIn + 0.44,
                signWidthIn,
                KAYAK_FIELD_ANCHORS.approved_by.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "approved_by")}
              title="Drag to adjust Approved By position"
            >
              <div className="truncate">{approvedByName}</div>
              <div className="truncate" style={{ marginTop: "2px" }}>
                {approvedByPos}
              </div>
            </div>

            {/* 4. Received By */}
            <div
              className={fieldCalibrationClass("received_by")}
              style={getOffsetStyle(
                "received_by",
                leftXIn + signWidthIn * 3,
                signTopIn + signHeaderHIn + 0.44,
                signWidthIn,
                KAYAK_FIELD_ANCHORS.received_by.defaultFontPt,
                "center",
                "normal"
              )}
              onMouseDown={(e) => handleMouseDownField(e, "received_by")}
              title="Drag to adjust Received By position"
            >
              <div className="truncate">{receivedByName}</div>
              <div className="truncate" style={{ marginTop: "2px" }}>
                {receivedByPos}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
