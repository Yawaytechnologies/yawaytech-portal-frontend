import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducer/authSlice";
import expenseReducer from "../reducer/expenseSlice"; // ✅ import expenseSlice
import categoryPieReducer from "../reducer/categoryPieSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    expense: expenseReducer, // ✅ add expense reducer
    categoryPie: categoryPieReducer,
  },
});
