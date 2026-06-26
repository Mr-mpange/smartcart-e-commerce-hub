export type AppRole = 'customer' | 'vendor' | 'delivery_rider' | 'admin' | 'reseller';

const rolePriority: AppRole[] = ['admin', 'vendor', 'delivery_rider', 'reseller', 'customer'];

export const getPrimaryRole = (roles: Array<string | null | undefined>): AppRole | null => {
  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return null;
};
