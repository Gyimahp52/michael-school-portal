import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { OfflineProvider } from './contexts/OfflineContext'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="macl-school-theme">
    <OfflineProvider autoSync={true} syncInterval={30000}>
      <App />
    </OfflineProvider>
  </ThemeProvider>
);
