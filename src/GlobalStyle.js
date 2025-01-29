import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Manrope', sans-serif;
  }
  .logo {
    text-align: left;
    margin: 30px 30px 30px 30px;
    width: 600px;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    background: rgb(89,55,123,0.2);
    padding: 20px 20px 20px 150px;
    width: 100%;
  }
  h2 {
    font-size: 1.2rem;
    font-weight: 600;
  }
  .bg-light {
    background: rgb(89,55,123,0.1);
  }
  a {
    color: black;
  }
  a:hover {
    color: #59377b;
  }
  .nav-link {
    color: #59377b;
  }
  .btn {
    --bs-border-radius: 1.5rem;
  }
  .btn-primary {
    --bs-btn-color: white;
    --bs-btn-bg: #1D1D1B;
    --bs-btn-border-color: #1D1D1B;
    --bs-btn-hover-color: #1D1D1B;
    --bs-btn-hover-bg: white;
    --bs-btn-hover-border-color: #1D1D1B;
    --bs-btn-active-color: white;
    --bs-btn-active-bg: #1D1D1B;
    --bs-btn-active-border-color: #1D1D1B;
    --bs-btn-disabled-color: white;
    --bs-btn-disabled-bg: grey;
    --bs-btn-disabled-border-color: grey;
  }
  .btn-outline-primary {
    --bs-btn-color: #1D1D1B;
    --bs-btn-bg: white;
    --bs-btn-border-color: #1D1D1B;
    --bs-btn-hover-color: white;
    --bs-btn-hover-bg: #1D1D1B;
    --bs-btn-hover-border-color: #1D1D1B;
    --bs-btn-active-color: #1D1D1B;
    --bs-btn-active-bg: white;
    --bs-btn-active-border-color: #1D1D1B;
    --bs-btn-disabled-color: #1D1D1B;
    --bs-btn-disabled-bg: white;
    --bs-btn-disabled-border-color: #1D1D1B;
  }
  .btn-warning {
    --bs-btn-color: #1D1D1B;
    --bs-btn-bg: white;
    --bs-btn-border-color: #1D1D1B;
    --bs-btn-hover-color: white;
    --bs-btn-hover-bg: #1D1D1B;
    --bs-btn-hover-border-color: #1D1D1B;
    --bs-btn-active-color: #1D1D1B;
    --bs-btn-active-bg: white;
    --bs-btn-active-border-color: #1D1D1B;
    --bs-btn-disabled-color: #1D1D1B;
    --bs-btn-disabled-bg: white;
    --bs-btn-disabled-border-color: #1D1D1B;
  }
`;
export default GlobalStyle;
