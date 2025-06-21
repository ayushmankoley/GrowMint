import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CivicAuthProvider } from './components/CivicAuthProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CivicAuthProvider>
      <App />
    </CivicAuthProvider>
  </StrictMode>
);
