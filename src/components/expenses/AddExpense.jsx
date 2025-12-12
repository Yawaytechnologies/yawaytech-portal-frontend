import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenses,
  createExpense,
  editExpense,
  removeExpense,
} from "../../redux/actions/expenseActions";

/* 🔔 Toastify */
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ---- Toast presets (top-center, comfy width, slide) ---- */
const TOAST_BASE = {
  position: "top-center",
  transition: Slide,
  autoClose: 2000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
};

// shared sizing (content-based, reasonable width)
const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  width: "fit-content",
  maxWidth: "90vw",
  minWidth: "clamp(240px, 30ch, 420px)", // content-driven
  height: "auto",
  minHeight: "36px",
  padding: "8px 18px",
  lineHeight: 1.35,
  margin: 0,
  borderRadius: "12px",
  boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
  fontSize: "0.95rem",
};

// colors (light bg, dark text)
const STYLE_SUCCESS = {
  ...PILL,
  background: "#ECFDF5",
  color: "#065F46",
  border: "1px solid #A7F3D0",
};
const STYLE_ERROR = {
  ...PILL,
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
};

const AddExpense = () => {
  const dispatch = useDispatch();
  const { expenseList, loading, error } = useSelector((s) => s.expense);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    description: "",
    addedBy: "",
  });

  // Stable toast helpers to satisfy exhaustive-deps
  const toastSuccess = useCallback(
    (msg) => toast(msg, { ...TOAST_BASE, style: STYLE_SUCCESS, icon: false }),
    []
  );
  const toastError = useCallback(
    (msg) => toast(msg, { ...TOAST_BASE, style: STYLE_ERROR, icon: false }),
    []
  );
  const toastDeleted = useCallback(
    (msg = "Expense deleted.") =>
      toast(msg, { ...TOAST_BASE, style: STYLE_ERROR, icon: false }),
    []
  );

  useEffect(() => {
    dispatch(fetchExpenses()).then((res) => {
      if (res?.error)
        toastError(res.error?.message || "Failed to load expenses.");
    });
  }, [dispatch, toastError]);

  useEffect(() => {
    if (error) toastError(String(error));
  }, [error, toastError]);

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "date") {
    let v = value;
    const parts = v.split("-");

    if (parts.length === 3) {
      let [p0, p1, p2] = parts;

      // Case 1: yyyy-mm-dd  → year is p0
      if (p0.length > 2) {
        if (p0.length > 4) p0 = p0.slice(0, 4);
      }
      // Case 2: dd-mm-yyyy → year is p2
      else if (p2.length > 2) {
        if (p2.length > 4) p2 = p2.slice(0, 4);
      }

      v = `${p0}-${p1}-${p2}`;
    }

    setFormData((prev) => ({ ...prev, [name]: v }));
    return;
  }

  // all other fields
  setFormData((prev) => ({ ...prev, [name]: value }));
};



  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      category: "",
      date: "",
      description: "",
      addedBy: "",
    });
    setEditingId(null);
  };

  const capitalizeWords = (text) =>
    (text || "")
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
      .join(" ");

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      title: capitalizeWords(formData.title),
      category: (formData.category || "").toUpperCase(),
      description: capitalizeWords(formData.description),
      addedBy: capitalizeWords(formData.addedBy),
    };

    if (editingId) {
      dispatch(editExpense({ id: editingId, updated: payload })).then((res) => {
        if (!res?.error) {
          toastSuccess("Expense updated successfully.");
          resetForm();
          setShowModal(false);
        } else {
          toastError(res.error?.message || "Update failed.");
        }
      });
    } else {
      dispatch(createExpense(payload)).then((res) => {
        if (!res?.error) {
          toastSuccess("Expense added successfully.");
          resetForm();
          setShowModal(false);
          setCurrentPage(Math.ceil((expenseList.length + 1) / itemsPerPage)); // jump to last page
        } else {
          toastError(res.error?.message || "Create failed.");
        }
      });
    }
  };

  const handleEdit = (id) => {
    const item = expenseList.find((e) => e.id === id);
    if (!item) return toastError("Unable to find the selected expense.");
    setFormData({
      title: item.title,
      amount: item.amount,
      category: (item.category || "").toUpperCase(),
      date: item.date,
      description: item.description,
      addedBy: item.addedBy ?? item.added_by,
    });
    setEditingId(id);
    setShowModal(true);
  };

  // 🗑️ Custom delete confirm (no browser popup)
  const askDelete = (id) => setDeleteTarget(id);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(removeExpense(deleteTarget)).then((res) => {
      if (!res?.error) {
        toastDeleted();
      } else {
        toastError(res.error?.message || "Delete failed.");
      }
      setDeleteTarget(null);
    });
  };
  const cancelDelete = () => setDeleteTarget(null);

  // Client-side search
  const filteredList = useMemo(() => {
    const search = (searchTerm || "").toLowerCase();
    return (expenseList || []).filter((item) => {
      const fields = [
        item.title,
        item.category,
        item.description,
        item.addedBy ?? item.added_by,
        item.amount,
        item.date,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return fields.some((f) => f.includes(search));
    });
  }, [expenseList, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <div className="px-4 md:px-6 max-w-full mx-auto text-[var(--text-secondary)]">
      {/* Top Bar: Heading + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--primary)]">
          Expense List
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search..."
            className="h-10 px-4 border border-gray-300 rounded-md text-sm w-full sm:w-52"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

          {/* Add Expense Button */}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="h-10 px-4 flex items-center justify-center gap-2 bg-[var(--secondary)] hover:bg-[var(--secondary-light)] text-white text-sm font-semibold rounded-md w-full sm:w-fit cursor-pointer"
          >
            <FaPlus className="text-sm" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600">{String(error)}</div>
      )}

      <div className="bg-[var(--surface)] shadow-md rounded-lg overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--primary)] text-white text-left">
              <th className="py-2 px-4 rounded-tl-lg">S.No</th>
              <th className="py-2 px-4">Title</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Category</th>
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Description</th>
              <th className="py-2 px-4">Added By</th>
              <th className="py-2 px-4 text-center rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="py-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : paginatedList.length > 0 ? (
              paginatedList.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-2 px-4 align-middle">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="py-2 px-4 align-middle">{item.title}</td>
                  <td className="py-2 px-4 align-middle">₹{item.amount}</td>
                  <td className="py-2 px-4 align-middle">{item.category}</td>
                  <td className="py-2 px-4 align-middle">{item.date}</td>
                  <td className="py-2 px-4 align-middle">{item.description}</td>
                  <td className="py-2 px-4 align-middle">
                    {item.addedBy ?? item.added_by}
                  </td>
                  <td className="py-2 px-4 align-middle">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-yellow-500 hover:text-yellow-600 text-sm cursor-pointer"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => askDelete(item.id)}
                        className="text-red-500 hover:text-red-600 text-sm cursor-pointer"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (right aligned) */}
      <div className="flex flex-wrap justify-end mt-4 gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`px-2 py-1 rounded border text-sm ${
              i + 1 === currentPage
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-2 sm:px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-3 sm:p-4 relative max-h-[70vh] overflow-y-auto md:ml-64 md:mr-4">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="absolute top-3 right-3 text-xl text-[var(--danger)] hover:text-red-600"
            >
              <IoClose />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-[var(--primary)] mb-4">
              {editingId ? "Edit Expense" : "Add New Expense"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <InputField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
              <InputField
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
              />
              <SelectField
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
              <InputField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
              <TextAreaField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              <InputField
                label="Added By"
                name="addedBy"
                value={formData.addedBy}
                onChange={handleChange}
              />

              {/* Submit Button Centered */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-[var(--accent)] hover:bg-yellow-500 text-[var(--primary)] font-semibold py-2 px-5 rounded text-sm"
                >
                  {editingId ? "Update Expense" : "Submit Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 Custom Delete Confirm (compact) */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-4">
            <div className="text-sm font-semibold text-gray-800">
              Delete Expense?
            </div>
            <p className="mt-1 text-[13px] text-gray-600">
              This action can’t be undone. Do you want to proceed?
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Toast container */}
      <ToastContainer
        position="top-center"
        transition={Slide}
        limit={3}
        closeButton={false}
        newestOnTop
        style={{ top: 12 }}
        containerClassName="!p-0 !m-0"
        toastClassName={() => "!m-0 !p-0"}
        bodyClassName="!m-0 !p-0"
        toastStyle={{ margin: 0, padding: 0 }}
      />
    </div>
  );
};

// Sub Components
const InputField = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      {...props}
      required
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
    />
  </div>
);



const TextAreaField = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      {...props}
      className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      placeholder="Optional description"
    />
  </div>
);

const SelectField = ({ name, value, onChange }) => (
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Category
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
    >
      <option value="">Select Category</option>
      <option value="FOOD">FOOD</option>
      <option value="TRANSPORT">TRANSPORT</option>
      <option value="UTILITIES">UTILITIES</option>
      <option value="ENTERTAINMENT">ENTERTAINMENT</option>
      <option value="SOFTWARE">SOFTWARE</option>
      <option value="SHOPPING">SHOPPING</option>
      <option value="HEALTH">HEALTH</option>
      <option value="OTHER">OTHER</option>
    </select>
  </div>
);

export default AddExpense;
