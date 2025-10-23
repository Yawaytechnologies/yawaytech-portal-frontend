// Normalizer shared by admin/employee inputs
export const normalizeId = (v) =>
  (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

// Adjust these to your real formats
export const isAdminId = (id = "") => /^ADMIN\d{4}$|^YTP\d{3}$/i.test(id); // ex: ADMIN0001 or YTP001
export const isEmployeeId = (id = "") => {
  const v = normalizeId(id);
  const strict = /^(?:EMP|YTP)\d{6}$/.test(v) || /^EMP\d{3}(?:\d{3})?$/.test(v); // keeps your EMP001 / EMP001234
  const generic = /^(?=.*[A-Z])(?=.*\d)(?:[A-Z0-9]{6}|[A-Z0-9]{9})$/.test(v);
  return strict || generic;
};
