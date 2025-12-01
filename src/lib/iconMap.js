import * as LucideIcons from 'lucide-react';

export const iconMap = Object.fromEntries(
  Object.entries(LucideIcons).filter(([key, value]) =>
    key !== 'createLucideIcon' &&
    key !== 'default' &&
    (typeof value === 'object' || typeof value === 'function') &&
    key[0] === key[0].toUpperCase()
  )
);

const industrialKeywords = [
  'factory', 'industry', 'building', 'warehouse',
  'gear', 'cog', 'settings', 'mechanical', 'wrench', 'hammer', 'tool', 'drill', 'axe', 'construction', 'hardhat',
  'zap', 'bolt', 'power', 'plug', 'battery', 'electric', 'energy', 'flash',
  'cpu', 'chip', 'processor', 'server', 'database', 'network', 'wifi', 'signal', 'radio', 'broadcast', 'bot', 'robot', 'brain', 'microchip',
  'box', 'package', 'container', 'archive', 'layers', 'stack', 'cuboid',
  'truck', 'car', 'bus', 'plane', 'ship', 'anchor', 'navigation', 'map', 'globe', 'compass', 'locate',
  'activity', 'pulse', 'heartbeat', 'chart', 'graph', 'bar', 'line', 'pie', 'trending',
  'thermometer', 'droplet', 'flame', 'wind', 'sun', 'moon', 'cloud', 'snowflake',
  'timer', 'clock', 'watch', 'calendar', 'hourglass', 'alarm',
  'file', 'folder', 'clipboard', 'list', 'check', 'x', 'plus', 'minus', 'alert', 'info', 'help',
  'scissors', 'ruler', 'scale', 'weight', 'tag', 'ticket', 'barcode', 'scan', 'qr',
  'shield', 'lock', 'key', 'unlock', 'security',
  'user', 'users', 'group', 'person',
  'arrow', 'chevron', 'play', 'pause', 'stop', 'circle', 'square', 'triangle'
];

const allIcons = Object.keys(iconMap);

// Remove duplicates if any (though Object.keys should be unique)
const uniqueIcons = [...new Set(allIcons)];

// Sort icons: Industrial keywords first, then alphabetical
export const iconList = uniqueIcons.sort((a, b) => {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  const aScore = industrialKeywords.findIndex(k => aLower.includes(k));
  const bScore = industrialKeywords.findIndex(k => bLower.includes(k));

  // If both have keywords, prioritize the earlier keyword in the list
  if (aScore !== -1 && bScore !== -1) {
    return aScore - bScore;
  }

  // If only a has keyword, it comes first
  if (aScore !== -1) return -1;

  // If only b has keyword, it comes first
  if (bScore !== -1) return 1;

  // Otherwise alphabetical
  return a.localeCompare(b);
});