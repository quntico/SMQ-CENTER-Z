import * as LucideIcons from 'lucide-react';

export const iconMap = Object.fromEntries(
  Object.entries(LucideIcons).filter(([key, value]) => 
    key !== 'createLucideIcon' && 
    key !== 'default' &&
    (typeof value === 'object' || typeof value === 'function') && 
    key[0] === key[0].toUpperCase()
  )
);

export const iconList = Object.keys(iconMap);