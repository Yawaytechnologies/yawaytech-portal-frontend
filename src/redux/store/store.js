// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducer/authSlice";
import expenseReducer from "../reducer/expenseSlice";
import categoryPieReducer from "../reducer/categoryPieSlice";
import comparisonBarReducer from "../reducer/comparisonBarSlice";
import summaryCardsReducer from "../reducer/summaryCardsSlice"; 
import { hrReducer } from "../reducer/hrSlice";
import { hrOverviewReducer } from "../reducer/hrOverviewSlice";
 




export const store = configureStore({
  reducer: {
    auth: authReducer,
    expense: expenseReducer,
    categoryPie: categoryPieReducer,
    comparisonBar: comparisonBarReducer,
    summaryCards: summaryCardsReducer, 
    hr:           hrReducer,
    hrOverview:   hrOverviewReducer,
   
  },
});

export default store;
