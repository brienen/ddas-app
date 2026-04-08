import React from 'react';
import MainForm from './MainForm';
import { CssBaseline } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import GlobalStyle from './GlobalStyle';

function App() {
  return (
    <div>
      <GlobalStyle />
      <CssBaseline />
      <MainForm />
    </div>
  );
}

export default App;
