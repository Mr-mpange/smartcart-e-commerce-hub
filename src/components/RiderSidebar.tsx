import { Truck, Package, CheckCircle2, Clock, BarChart3, Settings, Bell, DollarSign, Wallet, LogOut } from 'lucide-react';
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
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface RiderSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function RiderSidebar({ activeTab, onTabChange }: RiderSidebarProps) {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const collapsed = state === 'collapsed';

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const menuItems = [
    {
      title: 'Overview',
      icon: BarChart3,
      id: 'overview',
    },
    {
      title: 'Active Deliveries',
      icon: Truck,
      id: 'active',
    },
    {
      title: 'Completed',
      icon: CheckCircle2,
      id: 'completed',
    },
    {
      title: 'Payments',
      icon: DollarSign,
      id: 'payments',
    },
    {
      title: 'Wallet',
      icon: Wallet,
      id: 'wallet',
    },
    {
      title: 'Notifications',
      icon: Bell,
      id: 'notifications',
    },
    {
      title: 'Settings',
      icon: Settings,
      id: 'settings',
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="font-bold text-lg">Driver</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Deliveries</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
}
