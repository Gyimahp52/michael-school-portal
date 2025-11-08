import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="macl-school-theme">
    <App />
  </ThemeProvider>
);
