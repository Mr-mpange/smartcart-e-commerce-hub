import { AppRole } from '@/lib/user-role';

export const getDashboardRoute = (role: AppRole | string | null | undefined) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'delivery_rider':
      return '/rider/dashboard';
    case 'reseller':
      return '/reseller/dashboard';
    default:
      return '/';
  }
};
