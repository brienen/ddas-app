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
  .MuiTypography-h6 {
    font-size: 1.1rem;
    font-family: 'Manrope', sans-serif;
  }
  .btn {
    --bs-border-radius: 1.5rem;
  }
  .bg-light {
    background: rgb(89,55,123,0.1);
  }
`;
export default GlobalStyle;
