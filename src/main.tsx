import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { DatabaseSetupService } from './lib/database-setup'

// Initialize the offline database
DatabaseSetupService.initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="macl-school-theme">
    <App />
  </ThemeProvider>
);
