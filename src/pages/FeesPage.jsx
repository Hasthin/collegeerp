import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Filter,
  DollarSign,
  Receipt,
} from "lucide-react";
import { authFetch } from "../authFetch";

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ label, value, color = "blue" }) {
  const colorMap = {
    blue: "text-[#2469c7]",
    green: "text-[#36a66e]",
    gray: "text-[#8b98aa]",
  };

  return (
    <div className="rounded-lg border border-[#e7ebf1] bg-white px-4 py-3 shadow-soft">
      <span className="block text-[11px] font-medium text-[#8b98aa]">
        {label}
      </span>

      <strong
        className={`mt-1 block text-[24px] font-bold ${colorMap[color]}`}
      >
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <div className="relative max-h-[95vh] w-full max-w-2xl overflow-hidden rounded-xl border border-[#e5eaf1] bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#edf0f4] px-6 py-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#1a345c]">
                {title}
              </h2>

              {subtitle && (
                <p className="mt-1 text-[12px] text-[#8b98aa]">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#8b98aa] hover:bg-slate-100 hover:text-[#344c69]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[calc(95vh-80px)] overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
        {label}
        {required && <span className="ml-1 text-[#e05252]">*</span>}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none placeholder:text-[#a4afbd] focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20 disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#8b98aa]"
      />
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
        {label}
        {required && <span className="ml-1 text-[#e05252]">*</span>}
      </label>

      <select
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20 disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#8b98aa]"
      >
        <option value="">{placeholder || "-- Select --"}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   FEE STRUCTURE FORM
========================================================= */

function FeeStructureForm({ item, branches, semesters, onSave, onCancel }) {
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    branch_id: item?.branch_id || "",
    semester_id: item?.semester_id || "",
    fee_type: item?.fee_type || "",
    amount: item?.amount || "",
    academic_year: item?.academic_year || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      branch_id: item?.branch_id || "",
      semester_id: item?.semester_id || "",
      fee_type: item?.fee_type || "",
      amount: item?.amount || "",
      academic_year: item?.academic_year || "",
    });

    setError("");
  }, [item]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.branch_id) {
      setError("Branch is required.");
      return;
    }

    if (!form.semester_id) {
      setError("Semester is required.");
      return;
    }

    if (!form.fee_type.trim()) {
      setError("Fee type is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (!form.academic_year.trim()) {
      setError("Academic year is required.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        branch_id: form.branch_id,
        semester_id: form.semester_id,
        fee_type: form.fee_type.trim(),
        amount: Number(form.amount),
        academic_year: form.academic_year.trim(),
      });
    } catch (err) {
      setError(err.message || "Failed to save fee structure.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[#f5c2c2] bg-[#fff0f0] px-3 py-2.5 text-[12px] font-medium text-[#e05252]">
          {error}
        </div>
      )}

      {/* Fields */}
      <div>
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[.35px] text-[#1d4c86]">
          Fee Structure Details
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Branch */}
          <SelectField
            label="Branch"
            value={form.branch_id}
            onChange={handleChange("branch_id")}
            options={branches.map((b) => ({
              value: b.id,
              label: `${b.course_name} - ${b.branch_name}`,
            }))}
            placeholder="-- Select Branch --"
            disabled={isEdit}
            required
          />

          {/* Semester */}
          <SelectField
            label="Semester"
            value={form.semester_id}
            onChange={handleChange("semester_id")}
            options={semesters.map((s) => ({
              value: s.id,
              label: s.semester_name || s.name || `Semester ${s.id}`,
            }))}
            placeholder="-- Select Semester --"
            disabled={isEdit}
            required
          />

          {/* Fee Type */}
          <InputField
            label="Fee Type"
            value={form.fee_type}
            onChange={handleChange("fee_type")}
            placeholder="Tuition, Hostel, Exam..."
            required
          />

          {/* Amount */}
          <InputField
            label="Amount"
            value={form.amount}
            onChange={handleChange("amount")}
            placeholder="0.00"
            type="number"
            required
          />

          {/* Academic Year */}
          <InputField
            label="Academic Year"
            value={form.academic_year}
            onChange={handleChange("academic_year")}
            placeholder="2025-2026"
            required
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 border-t border-[#edf0f4] pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-[#e3e8ef] bg-white px-4 py-2 text-[13px] font-semibold text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#1b78ff] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}

          {saving
            ? "Saving..."
            : isEdit
              ? "Update Fee Structure"
              : "Add Fee Structure"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   FEE COLLECTION FORM
========================================================= */

function FeeCollectionForm({ students, feeStructures, onSave, onCancel }) {
  const [form, setForm] = useState({
    student_id: "",
    fee_structure_id: "",
    amount_paid: "",
    scholarship_amount: "",
    fine_amount: "",
    total_payable: "",
    payment_mode: "",
    receipt_no: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      student_id: "",
      fee_structure_id: "",
      amount_paid: "",
      scholarship_amount: "",
      fine_amount: "",
      total_payable: "",
      payment_mode: "",
      receipt_no: "",
    });

    setError("");
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.student_id) {
      setError("Student is required.");
      return;
    }

    if (!form.fee_structure_id) {
      setError("Fee structure is required.");
      return;
    }

    if (!form.amount_paid || Number(form.amount_paid) <= 0) {
      setError("Amount paid must be greater than 0.");
      return;
    }

    if (!form.total_payable || Number(form.total_payable) <= 0) {
      setError("Total payable is required.");
      return;
    }

    if (!form.payment_mode) {
      setError("Payment mode is required.");
      return;
    }

    if (!form.receipt_no.trim()) {
      setError("Receipt number is required.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        student_id: form.student_id,
        fee_structure_id: form.fee_structure_id,
        amount_paid: Number(form.amount_paid),
        scholarship_amount: Number(form.scholarship_amount) || 0,
        fine_amount: Number(form.fine_amount) || 0,
        total_payable: Number(form.total_payable),
        payment_mode: form.payment_mode,
        receipt_no: form.receipt_no.trim(),
      });
    } catch (err) {
      setError(err.message || "Failed to save fee collection.");
    } finally {
      setSaving(false);
    }
  };

  const paymentModes = [
    { value: "cash", label: "Cash" },
    { value: "online", label: "Online" },
    { value: "cheque", label: "Cheque" },
    { value: "dd", label: "DD (Demand Draft)" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[#f5c2c2] bg-[#fff0f0] px-3 py-2.5 text-[12px] font-medium text-[#e05252]">
          {error}
        </div>
      )}

      {/* Fields */}
      <div>
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[.35px] text-[#1d4c86]">
          Payment Details
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Student */}
          <SelectField
            label="Student"
            value={form.student_id}
            onChange={handleChange("student_id")}
            options={students.map((s) => ({
              value: s.id,
              label: `${s.name || s.full_name || "Unknown"} (${s.admission_no || s.id})`,
            }))}
            placeholder="-- Select Student --"
            required
          />

          {/* Fee Structure */}
          <SelectField
            label="Fee Structure"
            value={form.fee_structure_id}
            onChange={handleChange("fee_structure_id")}
            options={feeStructures.map((fs) => ({
              value: fs.id,
              label: `${fs.fee_type} - ${fs.amount} (${fs.academic_year || ""})`,
            }))}
            placeholder="-- Select Fee Structure --"
            required
          />

          {/* Amount Paid */}
          <InputField
            label="Amount Paid"
            value={form.amount_paid}
            onChange={handleChange("amount_paid")}
            placeholder="0.00"
            type="number"
            required
          />

          {/* Total Payable */}
          <InputField
            label="Total Payable"
            value={form.total_payable}
            onChange={handleChange("total_payable")}
            placeholder="0.00"
            type="number"
            required
          />

          {/* Scholarship Amount */}
          <InputField
            label="Scholarship Amount"
            value={form.scholarship_amount}
            onChange={handleChange("scholarship_amount")}
            placeholder="0.00"
            type="number"
          />

          {/* Fine Amount */}
          <InputField
            label="Fine Amount"
            value={form.fine_amount}
            onChange={handleChange("fine_amount")}
            placeholder="0.00"
            type="number"
          />

          {/* Payment Mode */}
          <SelectField
            label="Payment Mode"
            value={form.payment_mode}
            onChange={handleChange("payment_mode")}
            options={paymentModes}
            placeholder="-- Select Payment Mode --"
            required
          />

          {/* Receipt No */}
          <InputField
            label="Receipt No"
            value={form.receipt_no}
            onChange={handleChange("receipt_no")}
            placeholder="REC-001"
            required
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 border-t border-[#edf0f4] pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-[#e3e8ef] bg-white px-4 py-2 text-[13px] font-semibold text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#1b78ff] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}

          {saving ? "Saving..." : "Record Payment"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("structure");

  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeCollections, setFeeCollections] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [filterBranch, setFilterBranch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterBranchCollection, setFilterBranchCollection] = useState("");
  const [search, setSearch] = useState("");

  /* =========================================================
     CURRENT USER
  ========================================================= */

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  /* =========================================================
     FETCH BRANCHES
  ========================================================= */

  const fetchBranches = async () => {
    try {
      const res = await authFetch("/api/branches/all");
      const data = await res.json();

      if (res.ok && Array.isArray(data.branches)) {
        setBranches(data.branches);
      } else if (res.ok && Array.isArray(data)) {
        setBranches(data);
      }
    } catch (err) {
      console.error("Branches fetch error:", err);
    }
  };

  /* =========================================================
     FETCH SEMESTERS
  ========================================================= */

  const fetchSemesters = async () => {
    try {
      const res = await authFetch("/api/semesters");
      const data = await res.json();

      if (res.ok && Array.isArray(data.semesters)) {
        setSemesters(data.semesters);
      } else if (res.ok && Array.isArray(data)) {
        setSemesters(data);
      }
    } catch (err) {
      console.error("Semesters fetch error:", err);
    }
  };

  /* =========================================================
     FETCH STUDENTS
  ========================================================= */

  const fetchStudents = async () => {
    try {
      const res = await authFetch("/api/students");
      const data = await res.json();

      if (res.ok && Array.isArray(data.students)) {
        setStudents(data.students);
      } else if (res.ok && Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      console.error("Students fetch error:", err);
    }
  };

  /* =========================================================
     FETCH FEE STRUCTURES
  ========================================================= */

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filterBranch) params.set("branch_id", filterBranch);
      if (filterSemester) params.set("semester_id", filterSemester);

      const queryString = params.toString();
      const url = `/api/fees-structure${queryString ? `?${queryString}` : ""}`;

      const res = await authFetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to load fee structures"
        );
      }

      let structuresData = [];

      if (Array.isArray(data)) {
        structuresData = data;
      } else if (Array.isArray(data.fees_structure)) {
        structuresData = data.fees_structure;
      } else if (Array.isArray(data.data)) {
        structuresData = data.data;
      } else if (Array.isArray(data.results)) {
        structuresData = data.results;
      }

      setFeeStructures(structuresData);
    } catch (err) {
      console.error("Fee structures fetch error:", err);
      setFeeStructures([]);
      setError(err.message || "Unable to load fee structures.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FETCH FEE COLLECTIONS
  ========================================================= */

  const fetchFeeCollections = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filterBranchCollection) params.set("branch_id", filterBranchCollection);

      const queryString = params.toString();
      const url = `/api/fees-collection${queryString ? `?${queryString}` : ""}`;

      const res = await authFetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to load fee collections"
        );
      }

      let collectionsData = [];

      if (Array.isArray(data)) {
        collectionsData = data;
      } else if (Array.isArray(data.fees_collection)) {
        collectionsData = data.fees_collection;
      } else if (Array.isArray(data.data)) {
        collectionsData = data.data;
      } else if (Array.isArray(data.results)) {
        collectionsData = data.results;
      }

      setFeeCollections(collectionsData);
    } catch (err) {
      console.error("Fee collections fetch error:", err);
      setFeeCollections([]);
      setError(err.message || "Unable to load fee collections.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchBranches();
    fetchSemesters();
    fetchStudents();
  }, []);

  /* =========================================================
     TAB SWITCH
  ========================================================= */

  useEffect(() => {
    setSearch("");
    setEditing(null);
    setModalOpen(false);
    setError("");

    if (activeTab === "structure") {
      fetchFeeStructures();
    } else {
      fetchFeeCollections();
    }
  }, [activeTab]);

  /* =========================================================
     FILTERS — STRUCTURE
  ========================================================= */

  useEffect(() => {
    fetchFeeStructures();
  }, [filterBranch, filterSemester]);

  /* =========================================================
     FILTERS — COLLECTION
  ========================================================= */

  useEffect(() => {
    fetchFeeCollections();
  }, [filterBranchCollection]);

  /* =========================================================
     SEARCH — STRUCTURE
  ========================================================= */

  const filteredStructures = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return feeStructures;

    return feeStructures.filter((item) =>
      [
        item.fee_type,
        item.academic_year,
        item.amount,
        item.branch_name,
        item.semester_name,
        item.branch_id,
        item.semester_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, feeStructures]);

  /* =========================================================
     SEARCH — COLLECTION
  ========================================================= */

  const filteredCollections = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return feeCollections;

    return feeCollections.filter((item) =>
      [
        item.student_name,
        item.full_name,
        item.admission_no,
        item.roll_no,
        item.fee_type,
        item.amount_paid,
        item.payment_mode,
        item.receipt_no,
        item.branch_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, feeCollections]);

  /* =========================================================
     ADD / EDIT — STRUCTURE
  ========================================================= */

  const handleAddStructure = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEditStructure = (item) => {
    setEditing(item);
    setModalOpen(true);
  };

  /* =========================================================
     DELETE — STRUCTURE
  ========================================================= */

  const handleDeleteStructure = async (id) => {
    const item = feeStructures.find((s) => String(s.id) === String(id));

    if (!item) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.fee_type}" fee structure?`
    );

    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/fees-structure/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete fee structure.");
      }

      await fetchFeeStructures();
    } catch (err) {
      console.error("Delete fee structure error:", err);
      alert(err.message || "Failed to delete fee structure.");
    }
  };

  /* =========================================================
     SAVE — STRUCTURE
  ========================================================= */

  const handleSaveStructure = async (form) => {
    const url = editing
      ? `/api/fees-structure/${editing.id}`
      : "/api/fees-structure";

    const method = editing ? "PUT" : "POST";

    const res = await authFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    let data = {};

    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid response from server.");
    }

    if (!res.ok) {
      throw new Error(
        data.error || data.message || "Failed to save fee structure."
      );
    }

    await fetchFeeStructures();

    setModalOpen(false);
    setEditing(null);
  };

  /* =========================================================
     ADD — COLLECTION
  ========================================================= */

  const handleAddCollection = () => {
    setEditing(null);
    setModalOpen(true);
  };

  /* =========================================================
     DELETE — COLLECTION
  ========================================================= */

  const handleDeleteCollection = async (id) => {
    const item = feeCollections.find((c) => String(c.id) === String(id));

    if (!item) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete receipt "${item.receipt_no || id}"?`
    );

    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/fees-collection/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete fee collection.");
      }

      await fetchFeeCollections();
    } catch (err) {
      console.error("Delete fee collection error:", err);
      alert(err.message || "Failed to delete fee collection.");
    }
  };

  /* =========================================================
     SAVE — COLLECTION
  ========================================================= */

  const handleSaveCollection = async (form) => {
    const res = await authFetch("/api/fees-collection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        collected_by: currentUser?.id || currentUser?.email || "",
      }),
    });

    let data = {};

    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid response from server.");
    }

    if (!res.ok) {
      throw new Error(
        data.error || data.message || "Failed to record payment."
      );
    }

    await fetchFeeCollections();

    setModalOpen(false);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalStructureAmount = useMemo(() => {
    return feeStructures.reduce(
      (sum, s) => sum + (Number(s.amount) || 0),
      0
    );
  }, [feeStructures]);

  const totalCollected = useMemo(() => {
    return feeCollections.reduce(
      (sum, c) => sum + (Number(c.amount_paid) || 0),
      0
    );
  }, [feeCollections]);

  const totalPayable = useMemo(() => {
    return feeCollections.reduce(
      (sum, c) => sum + (Number(c.total_payable) || 0),
      0
    );
  }, [feeCollections]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-3">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <CreditCard size={18} />
          FEE MANAGEMENT
        </div>

        <h2 className="mt-2 text-[20px] font-bold">
          FEES STRUCTURE & COLLECTION
        </h2>

        <p className="mt-1 text-[13px] text-[#b8c9e6]">
          Manage fee structures for branches and semesters, record student
          payments, and track collections.
        </p>
      </section>

      {/* ====================================================
          TABS
      ==================================================== */}

      <div className="flex gap-1 rounded-lg border border-[#e5eaf1] bg-white p-1 shadow-soft">
        <button
          type="button"
          onClick={() => setActiveTab("structure")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition ${
            activeTab === "structure"
              ? "bg-[#1b78ff] text-white shadow-[0_2px_8px_rgba(27,120,255,.25)]"
              : "text-[#51627c] hover:bg-slate-50"
          }`}
        >
          <DollarSign size={16} />
          Fee Structure
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("collection")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition ${
            activeTab === "collection"
              ? "bg-[#1b78ff] text-white shadow-[0_2px_8px_rgba(27,120,255,.25)]"
              : "text-[#51627c] hover:bg-slate-50"
          }`}
        >
          <Receipt size={16} />
          Fee Collection
        </button>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-[#f5c2c2] bg-[#fff5f5] px-4 py-3">
          <span className="text-[12px] text-[#e05252]">{error}</span>

          <button
            type="button"
            onClick={() => {
              setError("");
              if (activeTab === "structure") {
                fetchFeeStructures();
              } else {
                fetchFeeCollections();
              }
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff]"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ====================================================
          FEE STRUCTURE TAB
      ==================================================== */}

      {activeTab === "structure" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="TOTAL STRUCTURES"
              value={feeStructures.length}
              color="blue"
            />

            <StatCard
              label="TOTAL AMOUNT"
              value={`₹${totalStructureAmount.toLocaleString("en-IN")}`}
              color="green"
            />

            <StatCard
              label="BRANCHES"
              value={
                new Set(feeStructures.map((s) => s.branch_id)).size
              }
              color="gray"
            />
          </div>

          {/* Table */}
          <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
                  FEE STRUCTURES
                </h3>

                <p className="mt-[2px] text-[11px] text-[#8d9aac]">
                  Manage fee structure definitions by branch and semester
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
                  <Search size={14} className="text-[#8d9aae]" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search structures..."
                    className="w-[160px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
                  />
                </div>

                {/* Add */}
                <button
                  type="button"
                  onClick={handleAddStructure}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0]"
                >
                  <Plus size={15} />
                  Add New
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 border-b border-[#edf0f4] px-4 py-3">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#51627c]">
                <Filter size={14} />
                Filters:
              </div>

              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="h-8 rounded-lg border border-[#e3e8ef] bg-white px-2 text-[12px] text-[#344c69] outline-none focus:border-[#1b78ff]"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.course_name} - {b.branch_name}
                  </option>
                ))}
              </select>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="h-8 rounded-lg border border-[#e3e8ef] bg-white px-2 text-[12px] text-[#344c69] outline-none focus:border-[#1b78ff]"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.semester_name || s.name || `Semester ${s.id}`}
                  </option>
                ))}
              </select>

              {(filterBranch || filterSemester) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterBranch("");
                    setFilterSemester("");
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#e05252] hover:underline"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    {[
                      "Branch",
                      "Semester",
                      "Fee Type",
                      "Amount",
                      "Academic Year",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-[#edf0f4] px-3 py-3"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-12 text-center"
                      >
                        <div className="flex items-center justify-center gap-2 text-[12px] text-[#8b98aa]">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#1b78ff]" />
                          Loading fee structures...
                        </div>
                      </td>
                    </tr>
                  ) : filteredStructures.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {search || filterBranch || filterSemester
                          ? "No fee structures match your search/filters."
                          : "No fee structures found."}
                      </td>
                    </tr>
                  ) : (
                    filteredStructures.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] hover:bg-[#fafcff]"
                      >
                        {/* Branch */}
                        <td className="px-3 py-3 font-medium text-[#344c69]">
                          {item.branch_name || item.branch_id || "-"}
                        </td>

                        {/* Semester */}
                        <td className="px-3 py-3">
                          {item.semester_name || item.semester_id || "-"}
                        </td>

                        {/* Fee Type */}
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {item.fee_type}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Academic Year */}
                        <td className="px-3 py-3">
                          {item.academic_year || "-"}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditStructure(item)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStructure(item.id)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0]"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#edf0f4] px-4 py-3">
              <span className="text-[11px] text-[#8b98aa]">
                Showing {filteredStructures.length} of {feeStructures.length}{" "}
                structures
              </span>

              <button
                type="button"
                onClick={fetchFeeStructures}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          </section>
        </>
      )}

      {/* ====================================================
          FEE COLLECTION TAB
      ==================================================== */}

      {activeTab === "collection" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="TOTAL PAYMENTS"
              value={feeCollections.length}
              color="blue"
            />

            <StatCard
              label="TOTAL COLLECTED"
              value={`₹${totalCollected.toLocaleString("en-IN")}`}
              color="green"
            />

            <StatCard
              label="TOTAL PAYABLE"
              value={`₹${totalPayable.toLocaleString("en-IN")}`}
              color="gray"
            />
          </div>

          {/* Table */}
          <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
                  FEE COLLECTIONS
                </h3>

                <p className="mt-[2px] text-[11px] text-[#8d9aac]">
                  Record and track student fee payments
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
                  <Search size={14} className="text-[#8d9aae]" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search collections..."
                    className="w-[160px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
                  />
                </div>

                {/* Add */}
                <button
                  type="button"
                  onClick={handleAddCollection}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0]"
                >
                  <Plus size={15} />
                  Record Payment
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 border-b border-[#edf0f4] px-4 py-3">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#51627c]">
                <Filter size={14} />
                Filter:
              </div>

              <select
                value={filterBranchCollection}
                onChange={(e) => setFilterBranchCollection(e.target.value)}
                className="h-8 rounded-lg border border-[#e3e8ef] bg-white px-2 text-[12px] text-[#344c69] outline-none focus:border-[#1b78ff]"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.course_name} - {b.branch_name}
                  </option>
                ))}
              </select>

              {filterBranchCollection && (
                <button
                  type="button"
                  onClick={() => setFilterBranchCollection("")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#e05252] hover:underline"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    {[
                      "Student Name",
                      "Admission No",
                      "Roll No",
                      "Branch",
                      "Fee Type",
                      "Amount Paid",
                      "Payment Mode",
                      "Receipt No",
                      "Payment Date",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-[#edf0f4] px-3 py-3"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-3 py-12 text-center"
                      >
                        <div className="flex items-center justify-center gap-2 text-[12px] text-[#8b98aa]">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#1b78ff]" />
                          Loading fee collections...
                        </div>
                      </td>
                    </tr>
                  ) : filteredCollections.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {search || filterBranchCollection
                          ? "No fee collections match your search/filters."
                          : "No fee collections found."}
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] hover:bg-[#fafcff]"
                      >
                        {/* Student Name */}
                        <td className="px-3 py-3 font-medium text-[#344c69]">
                          {item.student_name || item.full_name || "-"}
                        </td>

                        {/* Admission No */}
                        <td className="px-3 py-3">
                          {item.admission_no || "-"}
                        </td>

                        {/* Roll No */}
                        <td className="px-3 py-3">
                          {item.roll_no || "-"}
                        </td>

                        {/* Branch */}
                        <td className="px-3 py-3">
                          {item.branch_name || item.branch_id || "-"}
                        </td>

                        {/* Fee Type */}
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {item.fee_type || "-"}
                          </span>
                        </td>

                        {/* Amount Paid */}
                        <td className="px-3 py-3 font-semibold text-[#27885e]">
                          ₹{Number(item.amount_paid || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Payment Mode */}
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-1 text-[11px] font-semibold text-[#51627c] capitalize">
                            {item.payment_mode || "-"}
                          </span>
                        </td>

                        {/* Receipt No */}
                        <td className="px-3 py-3 font-medium text-[#4d5e76]">
                          {item.receipt_no || "-"}
                        </td>

                        {/* Payment Date */}
                        <td className="whitespace-nowrap px-3 py-3">
                          {item.payment_date
                            ? new Date(item.payment_date).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : item.created_at
                              ? new Date(item.created_at).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteCollection(item.id)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0]"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#edf0f4] px-4 py-3">
              <span className="text-[11px] text-[#8b98aa]">
                Showing {filteredCollections.length} of {feeCollections.length}{" "}
                payments
              </span>

              <button
                type="button"
                onClick={fetchFeeCollections}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          </section>
        </>
      )}

      {/* ====================================================
          MODAL — STRUCTURE
      ==================================================== */}

      {activeTab === "structure" && (
        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={editing ? "Edit Fee Structure" : "Add Fee Structure"}
          subtitle={
            editing
              ? "Update fee structure details"
              : "Create a new fee structure"
          }
        >
          <FeeStructureForm
            item={editing}
            branches={branches}
            semesters={semesters}
            onSave={handleSaveStructure}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {/* ====================================================
          MODAL — COLLECTION
      ==================================================== */}

      {activeTab === "collection" && (
        <Modal
          open={modalOpen}
          onClose={closeModal}
          title="Record Fee Payment"
          subtitle="Record a new student fee payment"
        >
          <FeeCollectionForm
            students={students}
            feeStructures={feeStructures}
            onSave={handleSaveCollection}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}
