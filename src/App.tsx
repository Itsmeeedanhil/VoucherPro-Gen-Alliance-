import { useEffect, useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BradwellFieldKey,
  ClientProfile,
  FieldOffset,
  SeriesConfig,
  SignatoriesConfig,
  VoucherData,
  VoucherHistoryEntry,
} from "./types/voucher";
import { Sidebar } from "./components/Sidebar";
import { VoucherCanvas } from "./components/VoucherCanvas";
import { SignatoriesModal } from "./components/SignatoriesModal";
import { VoucherHistoryModal } from "./components/VoucherHistoryModal";

// const KAYAK_COMPANY_NAME = "Kayak Construction Corp.";
const KAYAK_COMPANY_NAME = "General Alliance For Skilled Professional, Inc.";

const DEFAULT_CLIENT_PROFILE: ClientProfile = {
  id: "kayak",
  code: "KAYAK",
  name: KAYAK_COMPANY_NAME,
  address: "100 Naval St. Dolores 1920 Taytay Rizal Philippines",
  contact_number: "",
  website: "",
  tin: "243-354-422-00000",
  sub_companies: [KAYAK_COMPANY_NAME],
  enabled_forms: ["CV"],
  logo_url: null,
  layout_config: {
    page_size: "Letter",
    margin_top_mm: 0,
    margin_bottom_mm: 0,
    margin_left_mm: 0,
    margin_right_mm: 0,
    header_font_size: 16,
    body_font_size: 10,
    table_font_size: 9.5,
    show_company_header: true,
    show_class_column: true,
    show_customer_job_column: false,
    show_tin: false,
    signatory_columns: 4,
    check_x_offset_mm: 0,
    check_y_offset_mm: 0,
    check_date_spacing: 2,
    check_rotate_90: false,
    custom_title: "CHECK VOUCHER",
    preprinted_x_offset_mm: 0,
    preprinted_y_offset_mm: 0,
    show_amount_in_words_receipt: false,
    show_distribution_totals: true,
    field_offsets: {},
  },
};

export function App() {
  const [selectedClient, setSelectedClient] = useState<ClientProfile>(
    DEFAULT_CLIENT_PROFILE
  );
  const [cvRefNumber, setCvRefNumber] = useState<string>("");
  const [refNumber, setRefNumber] = useState<string>("");
  const [signatories, setSignatories] = useState<SignatoriesConfig | null>(
    null
  );
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [payeeOverride, setPayeeOverride] = useState<string>("");
  const [isSignatoriesOpen, setIsSignatoriesOpen] = useState<boolean>(false);

  // Print History State
  const [voucherHistory, setVoucherHistory] = useState<VoucherHistoryEntry[]>(
    []
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const isLoadedFromHistoryRef = useRef<boolean>(false);

  // Interactive Field Movement / Calibration & Full Form Template
  const [calibrationMode, setCalibrationMode] = useState<boolean>(false);
  const [showWireframeGuide, setShowWireframeGuide] = useState<boolean>(true);
  const [selectedField, setSelectedField] =
    useState<BradwellFieldKey | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const hist = await invoke<VoucherHistoryEntry[]>("get_voucher_history", {
        companyName: null,
      });
      setVoucherHistory(hist || []);
    } catch (err) {
      console.warn("History fetch warning:", err);
    }
  }, []);

  // Load Client Profile, Signatories & History from SQLite
  useEffect(() => {
    async function init() {
      try {
        const list = await invoke<ClientProfile[]>("get_clients");
        if (list && list.length > 0) {
          const kayak =
            list.find((c) => c.code === "KAYAK") || list[0];
          setSelectedClient({
            ...kayak,
            name: KAYAK_COMPANY_NAME,
            sub_companies: [KAYAK_COMPANY_NAME],
          });
        }
      } catch (err) {
        console.warn("Running outside Tauri or DB init warning:", err);
      }

      try {
        const [ser, sig] = await Promise.all([
          invoke<SeriesConfig>("get_series", {
            clientCode: KAYAK_COMPANY_NAME,
            formType: "CV",
          }),
          invoke<SignatoriesConfig>("get_signatories", {
            clientCode: "KAYAK",
          }),
        ]);
        setSignatories(sig);
        if (ser && ser.prefix) {
          // If prefix was saved as a full manual string, restore it
          const formatted =
            ser.digit_count === 0
              ? ser.prefix
              : `${ser.prefix}${String(ser.current_number).padStart(
                  ser.digit_count || 3,
                  "0"
                )}`;
          setCvRefNumber(formatted);
        }
      } catch (err) {
        console.warn("Meta fetch fallback:", err);
      }

      loadHistory();
    }
    init();
  }, [loadHistory]);

  const handleCvRefNumberChange = (val: string) => {
    setCvRefNumber(val);
    isLoadedFromHistoryRef.current = false;
    setVoucherData((prev) =>
      prev
        ? {
            ...prev,
            series_number: val,
          }
        : null
    );
    invoke("update_series", {
      config: {
        client_code: KAYAK_COMPANY_NAME,
        form_type: "CV",
        current_number: 1,
        prefix: val,
        digit_count: 0,
      },
    }).catch(() => {});
  };

  const fetchVoucher = useCallback(async () => {
    if (!refNumber.trim()) {
      setErrorMsg("Please enter a Check Reference # or Transaction Number.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    isLoadedFromHistoryRef.current = false;
    try {
      const data = await invoke<VoucherData>("query_quickbooks_voucher", {
        formType: "CV",
        clientCode: "KAYAK",
        companyName: KAYAK_COMPANY_NAME,
        refNumber: refNumber.trim(),
      });
      setVoucherData({
        ...data,
        company_name: KAYAK_COMPANY_NAME,
        series_number: cvRefNumber,
      });
    } catch (err: any) {
      setErrorMsg(typeof err === "string" ? err : err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [refNumber, cvRefNumber]);

  const handleSaveClientProfile = async (updated: ClientProfile) => {
    setSelectedClient(updated);
    try {
      await invoke("save_client_profile", { profile: updated });
    } catch (err: any) {
      setErrorMsg(String(err));
    }
  };

  const handleUpdateFieldOffset = (
    field: BradwellFieldKey,
    next: FieldOffset
  ) => {
    const cfg = selectedClient.layout_config;
    const updated: ClientProfile = {
      ...selectedClient,
      layout_config: {
        ...cfg,
        field_offsets: {
          ...(cfg.field_offsets ?? {}),
          [field]: next,
        },
      },
    };
    handleSaveClientProfile(updated);
  };

  const handleResetAllOffsets = () => {
    const cfg = selectedClient.layout_config;
    const updated: ClientProfile = {
      ...selectedClient,
      layout_config: {
        ...cfg,
        preprinted_x_offset_mm: 0,
        preprinted_y_offset_mm: 0,
        check_x_offset_mm: 0,
        check_y_offset_mm: 0,
        field_offsets: {},
      },
    };
    handleSaveClientProfile(updated);
  };

  const handleSaveSignatories = async (sig: SignatoriesConfig) => {
    setSignatories(sig);
    await invoke("save_signatories", { config: sig });
    if (voucherData) {
      setVoucherData({
        ...voucherData,
        signatories: sig,
      });
    }
  };

  const handleLoadHistoryEntry = (entry: VoucherHistoryEntry) => {
    isLoadedFromHistoryRef.current = true;
    setRefNumber(entry.ref_number);
    setCvRefNumber(entry.cv_number);
    setPayeeOverride("");
    setVoucherData({
      ...entry.voucher_data,
      company_name: KAYAK_COMPANY_NAME,
      series_number: entry.cv_number,
      payee_name: entry.payee_name,
    });
    setIsHistoryOpen(false);
  };

  const handleReprintHistoryEntry = (entry: VoucherHistoryEntry) => {
    handleLoadHistoryEntry(entry);
    setTimeout(() => {
      const prevTitle = document.title;
      document.title = "";
      const scroller = document.querySelector(".print-area");
      if (scroller) {
        scroller.scrollTop = 0;
        scroller.scrollLeft = 0;
      }
      window.scrollTo(0, 0);
      window.print();
      document.title = prevTitle;
    }, 150);
  };

  const handleDeleteHistoryEntry = async (id: number) => {
    try {
      await invoke("delete_voucher_history", { id });
      setVoucherHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setErrorMsg(String(err));
    }
  };

  const handlePrint = async () => {
    const prevTitle = document.title;
    document.title = "";
    const scroller = document.querySelector(".print-area");
    if (scroller) {
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
    }
    window.scrollTo(0, 0);

    window.print();
    document.title = prevTitle;

    if (voucherData) {
      const effectivePayee = payeeOverride.trim() || voucherData.payee_name;
      const snapshotToSave: VoucherData = {
        ...voucherData,
        company_name: KAYAK_COMPANY_NAME,
        series_number: cvRefNumber,
        payee_name: effectivePayee,
      };

      try {
        await invoke("save_voucher_history", {
          companyName: KAYAK_COMPANY_NAME,
          cvNumber: cvRefNumber,
          refNumber: voucherData.ref_number,
          payeeName: effectivePayee,
          voucherDate: voucherData.date,
          totalAmount: voucherData.total_amount,
          voucherData: snapshotToSave,
        });
        loadHistory();
      } catch (err) {
        console.error("Failed to save voucher print history:", err);
      }
    }
  };

  return (
    <div className="app-shell flex h-screen w-screen overflow-hidden bg-slate-950 mode-cv">
      <Sidebar
        cvRefNumber={cvRefNumber}
        onCvRefNumberChange={handleCvRefNumberChange}
        refNumber={refNumber}
        onRefNumberChange={setRefNumber}
        onSearchVoucher={fetchVoucher}
        isLoading={isLoading}
        payeeOverride={payeeOverride}
        onPayeeOverrideChange={setPayeeOverride}
        onOpenSignatoriesModal={() => setIsSignatoriesOpen(true)}
        historyCount={voucherHistory.length}
        onOpenHistoryModal={() => setIsHistoryOpen(true)}
        onPrint={handlePrint}
      />

      <VoucherCanvas
        voucherData={voucherData}
        client={selectedClient}
        payeeOverride={payeeOverride}
        errorMsg={errorMsg}
        showWireframeGuide={showWireframeGuide}
        onToggleWireframeGuide={setShowWireframeGuide}
        calibrationMode={calibrationMode}
        onToggleCalibrationMode={setCalibrationMode}
        selectedField={selectedField}
        onSelectField={setSelectedField}
        onUpdateFieldOffset={handleUpdateFieldOffset}
        onResetAllOffsets={handleResetAllOffsets}
      />

      {signatories && (
        <SignatoriesModal
          isOpen={isSignatoriesOpen}
          onClose={() => setIsSignatoriesOpen(false)}
          client={selectedClient}
          signatories={signatories}
          onSaveSignatories={handleSaveSignatories}
        />
      )}

      <VoucherHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={voucherHistory}
        companies={[KAYAK_COMPANY_NAME]}
        selectedCompany={KAYAK_COMPANY_NAME}
        onLoadEntry={handleLoadHistoryEntry}
        onReprintEntry={handleReprintHistoryEntry}
        onDeleteEntry={handleDeleteHistoryEntry}
      />
    </div>
  );
}

export default App;
