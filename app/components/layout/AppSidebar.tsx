"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  ClipboardList,
  CalendarClock,
  Users,
  BarChart3,
  DollarSign,
  Image,
  Mic2,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href}>
          <Icon className="size-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as { role?: string })?.role === "Admin";
  const isLibrarian = ["Admin", "Librarian"].includes(
    (session?.user as { role?: string })?.role || ""
  );

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (!session) return null;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
<SidebarMenuItem>
                <SidebarMenuButton asChild isActive={false} tooltip="Read Nest">
                  <Link href="/dashboard" className="font-semibold">
                    <BookOpen className="size-5" />
                    <span>Read Nest</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/dashboard" label="Discover" icon={LayoutDashboard} />
              <NavItem href="/books" label="Category" icon={BookOpen} />
              <NavItem href="/books" label="My Library" icon={Library} />
              {isLibrarian && (
                <>
                  <NavItem href="/loans" label="Loans" icon={ClipboardList} />
                  <NavItem href="/reservations" label="Reservations" icon={CalendarClock} />
                </>
              )}
              {isAdmin && (
                <NavItem href="/admin/users" label="Users" icon={Users} />
              )}
              <NavItem href="/reports" label="Reports" icon={BarChart3} />
              <NavItem href="/fines" label="Fines" icon={DollarSign} />
              <NavItem href="/image-search" label="Image Search" icon={Image} />
              <NavItem href="/recitation" label="Recitations" icon={Mic2} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/dashboard">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Support">
                  <Link href="/dashboard">
                    <HelpCircle className="size-4" />
                    <span>Support</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Logout"
                  onClick={handleSignOut}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
