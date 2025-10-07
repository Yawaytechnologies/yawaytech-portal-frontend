import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSoftwareDevelopersAPI } from "../services/softwareDevService";

// Async thunk
export const fetchSoftwareDevelopers = createAsyncThunk(
  "softwareDev/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchSoftwareDevelopersAPI();
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load software developers");
    }
  }
);

const softwareDevSlice = createSlice({
  name: "softwareDev",
  initialState: {
    developers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSoftwareDevelopers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSoftwareDevelopers.fulfilled, (state, action) => {
        state.loading = false;
        state.developers = action.payload || [];
      })
      .addCase(fetchSoftwareDevelopers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load software developers";
      });
  },
});

export const softwareDevReducer = softwareDevSlice.reducer;
