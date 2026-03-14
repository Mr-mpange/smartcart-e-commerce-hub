import { ShoppingCart, Package, TrendingUp, DollarSign, Wallet, Bell, Settings, BarChart3, LogOut } from 'lucide-react';
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

interface ResellerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ResellerSidebar({ activeTab, onTabChange }: ResellerSidebarProps) {
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
      title: 'My Products',
      icon: Package,
      id: 'products',
    },
    {
      title: 'Sales History',
      icon: TrendingUp,
      id: 'sales',
    },
    {
      title: 'Commissions',
      icon: DollarSign,
      id: 'commissions',
    },
    {
      title: 'Payment Collection',
      icon: Wallet,
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
            <ShoppingCart className="h-4 w-4" />
            Reseller Dashboard
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