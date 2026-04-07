import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { ConnectionStatusBanner } from "@/components/shared/ConnectionStatusBanner";

export function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-x-hidden">
            <ConnectionStatusBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}