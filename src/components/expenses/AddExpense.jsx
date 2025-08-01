import React, { useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const AddExpense = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    description: "",
    addedBy: "",
  });

  const [expenseList, setExpenseList] = useState([
    {
      title: "Lunch",
      amount: "250",
      category: "Food",
      date: "2025-07-29",
      description: "Team lunch with clients",
      addedBy: "Jana",
    },
    {
      title: "Bus Ticket",
      amount: "50",
      category: "Transport",
      date: "2025-07-28",
      description: "Office commute",
      addedBy: "Kumar",
    },
  ]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
    setEditingIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const capitalizeWords = (text) =>
      text
        .split(" ")
        .map((word) =>
          word.length > 0
            ? word[0].toUpperCase() + word.slice(1).toLowerCase()
            : ""
        )
        .join(" ");

    const updatedData = {
      ...formData,
      title: capitalizeWords(formData.title),
      category: capitalizeWords(formData.category),
      description: capitalizeWords(formData.description),
      addedBy: capitalizeWords(formData.addedBy),
    };

    if (editingIndex !== null) {
      const updatedList = [...expenseList];
      updatedList[editingIndex] = updatedData;
      setExpenseList(updatedList);
    } else {
      setExpenseList((prev) => [...prev, updatedData]);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (index) => {
    setFormData(expenseList[index]);
    setEditingIndex(index);
    setShowModal(true);
  };

  const handleDelete = (index) => {
    const updated = expenseList.filter((_, i) => i !== index);
    setExpenseList(updated);
  };

  const filteredList = expenseList.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.addedBy.toLowerCase().includes(search)
    );
  });

  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

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
            {paginatedList.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 transition">
                <td className="py-2 px-4 align-middle">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-2 px-4 align-middle">{item.title}</td>
                <td className="py-2 px-4 align-middle">₹{item.amount}</td>
                <td className="py-2 px-4 align-middle">{item.category}</td>
                <td className="py-2 px-4 align-middle">{item.date}</td>
                <td className="py-2 px-4 align-middle">{item.description}</td>
                <td className="py-2 px-4 align-middle">{item.addedBy}</td>
                <td className="py-2 px-4 align-middle">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() =>
                        handleEdit(index + (currentPage - 1) * itemsPerPage)
                      }
                      className="text-yellow-500 hover:text-yellow-600 text-sm cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(index + (currentPage - 1) * itemsPerPage)
                      }
                      className="text-red-500 hover:text-red-600 text-sm cursor-pointer"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedList.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-end mt-4 gap-2">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`px-1 py-.5 rounded border text-sm ${
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
        {editingIndex !== null ? "Edit Expense" : "Add New Expense"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <InputField label="Title" name="title" value={formData.title} onChange={handleChange} />
        <InputField label="Amount" name="amount" type="number" value={formData.amount} onChange={handleChange} />
        <SelectField name="category" value={formData.category} onChange={handleChange} />
        <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} />
        <TextAreaField label="Description" name="description" value={formData.description} onChange={handleChange} />
        <InputField label="Added By" name="addedBy" value={formData.addedBy} onChange={handleChange} />

        {/* Submit Button Centered */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-[var(--accent)] hover:bg-yellow-500 text-[var(--primary)] font-semibold py-2 px-5 rounded text-sm"
          >
            {editingIndex !== null ? "Update Expense" : "Submit Expense"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}



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
      <option value="Food">Food</option>
      <option value="Transport">Transport</option>
      <option value="Stationary">Stationary</option>
      <option value="Shopping">Shopping</option>
      <option value="Health">Health</option>
      <option value="Others">Others</option>
    </select>
  </div>
);

export default AddExpense;
