import { createSlice } from '@reduxjs/toolkit';

const initialTheme = localStorage.getItem('staffsync_theme') || 'light';
document.documentElement.setAttribute('data-theme', initialTheme);

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: initialTheme,
  },
  reducers: {
    toggleTheme: (state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      state.mode = newMode;
      localStorage.setItem('staffsync_theme', newMode);
      document.documentElement.setAttribute('data-theme', newMode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('staffsync_theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;

