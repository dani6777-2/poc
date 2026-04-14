/**
 * Sidebar navigation structure and links.
 */
export const NAVBAR_SECTIONS = [
  {
    title: 'Annual Planning',
    links: [
      { to: '/', icon: '📊', label: 'Main Dashboard' },
      { to: '/revenues', icon: '💵', label: 'Revenues' },
      { to: '/annual-expenses', icon: '📋', label: 'Annual Expenses' },
    ]
  },
  {
    title: 'Monthly Control',
    links: [
      { to: '/registry', icon: '🛒', label: 'Registry' },
      { to: '/budget', icon: '💰', label: 'Budget' },
      { to: '/analysis', icon: '📈', label: 'Analytics' },
      { to: '/card', icon: '💳', label: 'Credit Card', alertKey: 'card' },
      { to: '/health', icon: '🏥', label: 'Financial Health', alertKey: 'health' },
    ]
  },
  {
    title: 'Shopping Lists',
    links: [
      { to: '/block-a', icon: '🏪', label: 'Block A — Super' },
      { to: '/block-b', icon: '🥩', label: 'Block B — Market' },
    ]
  },
];
