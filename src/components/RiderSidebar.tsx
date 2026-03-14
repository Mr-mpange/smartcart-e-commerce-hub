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
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RiderSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function RiderSidebar({ activeTab, onTabChange }: RiderSidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
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
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Rider Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}