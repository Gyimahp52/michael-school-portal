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

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    group: "Main",
  },
  {
    title: "Students",
    url: "/dashboard/students",
    icon: Users,
    group: "Academic",
  },
  {
    title: "Teachers",
    url: "/dashboard/teachers",
    icon: GraduationCap,
    group: "Academic",
  },
  {
    title: "Classes & Subjects",
    url: "/dashboard/classes",
    icon: BookOpen,
    group: "Academic",
  },
  {
    title: "Admissions",
    url: "/dashboard/admissions",
    icon: UserPlus,
    group: "Management",
  },
  {
    title: "Grades & Records", 
    url: "/dashboard/grades",
    icon: FileText,
    group: "Management",
  },
  {
    title: "Reports & Analytics",
    url: "/dashboard/reports", 
    icon: FileText,
    group: "Management",
  },
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: Users,
    group: "System", 
  },
  {
    title: "Fees & Billing",
    url: "/dashboard/billing",
    icon: Calculator,
    group: "Financial",
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    group: "System",
  },
];

const groupedItems = navigationItems.reduce((acc, item) => {
  if (!acc[item.group]) {
    acc[item.group] = [];
  }
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, typeof navigationItems>);

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

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