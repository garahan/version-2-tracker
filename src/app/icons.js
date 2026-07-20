// ============================================================
// Life OS v3 — SF Symbols-style icon library
// Minimal SVG line icons (Apple SF Symbols aesthetic).
// Blueprint: "SF Symbols. No emoji in interface.
//             Emoji only for Reflection."
//
// Usage:  icon('body')  → returns an SVG DOM node
//         iconHTML('body') → returns an SVG string
// ============================================================

import { svg, svgEl } from './dom.js';

// ---- Icon paths (24x24 viewBox, stroke-based) ----
const PATHS = {
  // Foundation
  body:        '<path d="M12 5a2 2 0 100 4 2 2 0 000-4zM8 21v-6M16 21v-6M12 13v8M9 13l-1 2M15 13l1 2"/>',
  performance: '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
  longevity:   '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z"/>',
  recovery:    '<path d="M21 12.8A9 9 0 1112 3M21 3v6h-6"/>',
  nutrition:   '<path d="M12 2v6M9 8h6M7 12c0 4 2 8 5 8s5-4 5-8M5 22h14"/>',
  training:    '<path d="M6 4v16M18 4v16M6 12h12M3 8v8M21 8v8"/>',
  medical:     '<path d="M12 5v14M5 12h14"/>',
  // Psyche
  stress:      '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
  emotions:    '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  flexibility: '<path d="M12 2a3 3 0 013 3v3a3 3 0 003 3 3 3 0 010 6 3 3 0 00-3 3 3 3 0 01-6 0 3 3 0 00-3-3 3 3 0 010-6 3 3 0 003-3V5a3 3 0 013-3z"/>',
  identity:    '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/>',
  // Environment
  physical:    '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>',
  digital:     '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  financial:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9a2.5 2.5 0 00-2.5-1.5h-1a2 2 0 100 4h2a2 2 0 110 4h-1a2.5 2.5 0 01-2.5-1.5"/>',
  home:        '<path d="M3 12l9-8 9 8M5 10v10h14V10"/>',
  workspace:   '<rect x="2" y="4" width="20" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  // Executive
  attention:   '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  decision:    '<path d="M9 18l6-6-6-6"/>',
  knowledge:   '<path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  // Capital
  bioCapital:  '<path d="M12 2a3 3 0 013 3c0 1.5-1 3-3 5-2-2-3-3.5-3-5a3 3 0 013-3zM12 10v10M8 20h8"/>',
  intelCapital:'<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>',
  finCapital:  '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  socialCapital:'<circle cx="9" cy="7" r="4"/><path d="M1 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/><circle cx="17" cy="7" r="3"/>',
  familyCapital:'<circle cx="12" cy="8" r="3"/><circle cx="6" cy="14" r="2.5"/><circle cx="18" cy="14" r="2.5"/><path d="M7 21v-1a3 3 0 013-3h4a3 3 0 013 3v1"/>',
  productCapital:'<path d="M2 20h20M4 20V8l8-5 8 5v12M9 20v-6h6v6"/>',
  repCapital:   '<path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>',
  // Strategy
  vision:      '<circle cx="12" cy="12" r="9"/><path d="M12 7a5 5 0 015 5M12 7a5 5 0 00-5 5M12 12h.01"/>',
  goals:       '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  projects:    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  allocation:  '<path d="M12 2v20M2 12h20M12 2a10 10 0 010 20 10 10 0 010-20"/>',
  // Legacy
  family:      '<circle cx="12" cy="8" r="3"/><circle cx="6" cy="14" r="2.5"/><circle cx="18" cy="14" r="2.5"/><path d="M7 21v-1a3 3 0 013-3h4a3 3 0 013 3v1"/>',
  teaching:    '<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>',
  opensource:  '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.5a3 3 0 00-.9-2.6c3-.3 6-1.5 6-6.5a5 5 0 00-1.4-3.5 4.6 4.6 0 00-.1-3.5s-1.1-.3-3.5 1.3a12 12 0 00-6.2 0C6.5 1 5.4 1.3 5.4 1.3a4.6 4.6 0 00-.1 3.5A5 5 0 003.9 8.3c0 5 3 6.2 6 6.5a3 3 0 00-.9 2.6V21"/>',
  company:     '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9l3-6h12l3 6M9 21v-6h6v6"/>',
  books:       '<path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  values:      '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z"/>',
  // Engines
  inbox:       '<path d="M2 4h20v14H2zM2 8l10 6 10-6"/>',
  lessons:     '<path d="M12 2v6M9 8h6M7 12c0 4 2 8 5 8s5-4 5-8M5 22h14"/>',
  recall:      '<path d="M9 18l6-6-6-6M3 12h12"/>',
  risks:       '<path d="M12 2L3 6v6c0 5 3.5 9 9 10 5.5-1 9-5 9-10V6l-9-4z"/>',
  opportunities:'<path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 7v5l3 3"/>',
  commitments: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l3 3 5-5"/>',
  leverage:    '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
  settings:    '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.3l2-1.5-2-3.4-2.4 1a7 7 0 00-2.2-1.3L14 2h-4l-.3 2.5a7 7 0 00-2.2 1.3l-2.4-1-2 3.4 2 1.5A7 7 0 005 12a7 7 0 00.1 1.3l-2 1.5 2 3.4 2.4-1a7 7 0 002.2 1.3L10 22h4l.3-2.5a7 7 0 002.2-1.3l2.4 1 2-3.4-2-1.5A7 7 0 0019 12z"/>',
  health:      '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  analytics:   '<path d="M3 3v18h18M7 14l4-4 4 4 5-5"/>',
  dependencies:'<circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6M6 9v6M18 9v6M9 18h6"/>',
  // Nav
  today:       '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  domains:     '<circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/>',
  northstar:   '<path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>',
  more:        '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  // Actions
  focus:       '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  review:      '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h5"/>',
  // Misc
  shield:      '<path d="M12 2L3 6v6c0 5 3.5 9 9 10 5.5-1 9-5 9-10V6l-9-4z"/>',
  flame:       '<path d="M12 2c0 4-4 4-4 8a4 4 0 008 0c0-2-2-4-2-4s-2 2-2-4z"/>',
  check:       '<path d="M5 13l4 4L19 7"/>',
  plus:        '<path d="M12 5v14M5 12h14"/>',
  back:        '<path d="M15 18l-6-6 6-6"/>',
  close:       '<path d="M18 6L6 18M6 6l12 12"/>',
};

// ---- Get icon as SVG DOM node ----
export function icon(name, size = 24) {
  const path = PATHS[name];
  if (!path) return null;
  const node = svg(`0 0 24 24`, { width: String(size), height: String(size), class: 'sf-icon' }, []);
  node.innerHTML = path;
  return node;
}

// ---- Get icon as inline SVG string ----
export function iconHTML(name, size = 24) {
  const path = PATHS[name];
  if (!path) return '';
  return `<svg class="sf-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

// ---- Check if icon exists ----
export function hasIcon(name) {
  return name in PATHS;
}
