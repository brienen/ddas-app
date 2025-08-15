import React from 'react';
import RegistrationForm from './RegistrationForm12';
import { CssBaseline } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import GlobalStyle from './GlobalStyle';

function App() {
  return (
    <div>
      <GlobalStyle />
      <CssBaseline />
      <RegistrationForm />
    </div>
  );
}

export default App;
