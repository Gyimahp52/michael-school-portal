import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { DatabaseSetupService } from './lib/database-setup'
import { SyncService } from './lib/sync-service'

// Initialize the offline database
DatabaseSetupService.initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
});

// Initialize real-time sync service
SyncService.initialize();
console.log('Real-time sync service initialized');

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="macl-school-theme">
    <App />
  </ThemeProvider>
);
