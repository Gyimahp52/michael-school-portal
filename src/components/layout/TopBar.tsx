import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut, Key } from "lucide-react";
import { useAuth } from "@/contexts/HybridAuthContext";
import { Button } from "@/components/ui/button";
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
import { subscribeToPromotionRequests, type PromotionRequest } from "@/lib/database-operations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TopBar() {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { logout, currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [pendingPromotionCount, setPendingPromotionCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToPromotionRequests((requests: PromotionRequest[]) => {
      const count = requests.filter(r => r.status === 'pending').length;
      setPendingPromotionCount(count);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card shadow-soft">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={() => pendingPromotionCount > 0 && navigate('/admin/promotions')}
          >
            <Bell className="h-5 w-5" />
            {pendingPromotionCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                {pendingPromotionCount}
              </Badge>
            )}
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
                onClick={() => setLogoutDialogOpen(true)}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to login again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={logout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}