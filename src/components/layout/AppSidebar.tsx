import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calculator,
  UserPlus,
  FileText,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/CustomAuthContext";

const baseItems = [
  {
    title: "Dashboard",
    suffix: "",
    icon: LayoutDashboard,
    group: "Main",
  },
  {
    title: "Students",
    suffix: "/students",
    icon: Users,
    group: "Academic",
  },
  {
    title: "Teachers",
    suffix: "/users",
    icon: GraduationCap,
    group: "Academic",
  },
  {
    title: "Classes & Subjects",
    suffix: "/classes",
    icon: BookOpen,
    group: "Academic",
  },
  {
    title: "Admissions",
    suffix: "/admissions",
    icon: UserPlus,
    group: "Management",
  },
  {
    title: "Grades & Records", 
    suffix: "/grades",
    icon: FileText,
    group: "Management",
  },
  {
    title: "Reports & Analytics",
    suffix: "/reports", 
    icon: FileText,
    group: "Management",
  },
  {
    title: "User Management",
    suffix: "/users",
    icon: Users,
    group: "System", 
  },
  {
    title: "Fees & Billing",
    suffix: "/billing",
    icon: Calculator,
    group: "Financial",
  },
  {
    title: "Settings",
    suffix: "/settings",
    icon: Settings,
    group: "System",
  },
];

function buildNavigation(userRole?: string | null) {
  const basePath = userRole ? `/${userRole}` : "/admin";

  // Filter items by role
  const visible = baseItems.filter((item) => {
    if (userRole === 'teacher') {
      return ["Dashboard","Classes & Subjects","Students","Grades & Records","Reports & Analytics","Settings"].includes(item.title);
    }
    if (userRole === 'accountant') {
      return ["Dashboard","Fees & Billing","Reports & Analytics","Settings"].includes(item.title);
    }
    // default admin: show all
    return true;
  }).map(item => ({
    ...item,
    url: `${basePath}${item.suffix}`,
  }));

  const grouped = visible.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [] as typeof visible;
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof visible>);

  return grouped;
}

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { userRole } = useAuth();
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const groupedItems = buildNavigation(userRole);

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-medium">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Michael Agyei School
              </h2>
              <p className="text-sm text-sidebar-foreground/70">
                Management System
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName} className="mb-4">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider px-3 mb-2">
                {groupName}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "w-full justify-start px-3 py-2 rounded-lg transition-all duration-200",
                        isActive(item.url)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}