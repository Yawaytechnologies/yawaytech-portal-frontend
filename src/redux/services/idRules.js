// Normalizer shared by admin/employee inputs
export const normalizeId = (v) =>
  (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

// Adjust these to your real formats
export const isAdminId = (id = "") => /^ADMIN\d{4}$|^YTP\d{3}$/i.test(id); // ex: ADMIN0001 or YTP001
export const isEmployeeId = (id = "") => /^EMP\d{3}(\d{3})?$/i.test(id);   // EMP001 or EMP001234
