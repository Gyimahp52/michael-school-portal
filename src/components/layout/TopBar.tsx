import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, Settings, LogOut, Key, Database } from "lucide-react";
import { useAuth } from "@/contexts/CustomAuthContext";
import ConnectionStatus from "@/components/shared/ConnectionStatus";
import SyncProgressDialog from "@/components/shared/SyncProgressDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChangePasswordDialog } from "@/components/dialogs/ChangePasswordDialog";

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const { logout, currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = searchQuery.trim();
    if (!q) return;
    const base = userRole === 'admin' ? '/admin' : userRole === 'teacher' ? '/teacher' : userRole === 'accountant' ? '/accountant' : '';
    const target = userRole === 'accountant' ? `${base}/billing` : `${base}/students`;
    const url = `${target}?q=${encodeURIComponent(q)}`;
    navigate(url);
  };

  return (
    <header className="h-16 border-b border-border bg-card shadow-soft">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          
          {/* Search - Hidden on mobile */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students, teachers, or records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full md:w-64 lg:w-80 pl-10 bg-muted/50 border-border focus:bg-background"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <ConnectionStatus />
          
          {/* Sync Progress */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSyncDialogOpen(true)}
            className="gap-1"
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sync</span>
          </Button>
          {/* Quick Actions - Only show for non-accountants */}
          {userRole !== 'accountant' && (
            <>
              <Button variant="outline" size="sm" className="gap-2 hidden md:flex" onClick={() => navigate('/admin/students')}>
                <User className="h-4 w-4" />
                Add Student
              </Button>
              
              {/* Mobile Quick Action */}
              <Button variant="outline" size="sm" className="md:hidden" onClick={() => navigate('/admin/students')}>
                <User className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive">
              3
            </Badge>
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">
                    {currentUser?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{userRole || 'User'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="gap-2" onClick={() => navigate('/admin/settings')}>
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => setPasswordDialogOpen(true)}>
                <Key className="h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => navigate('/admin/settings')}>
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 text-destructive cursor-pointer"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      <SyncProgressDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen} />
    </header>
  );
}