/**
 * GPMS Public Page — Configurable Settings
 * 
 * All public-page-specific content (announcements, social links, 
 * live stream settings) lives here so it can be updated without 
 * touching the component code.
 */

// ─── Announcements ───────────────────────────────────────────
export interface Announcement {
  text: string;
  date: string; // display date string e.g. "13 Aug 2025"
}

// ─── Social Links ────────────────────────────────────────────
// Only links that are provided (non-empty) will be rendered.
// Leave a field empty string '' to hide that icon.
export const socialLinks = {
  youtube:   'https://www.youtube.com/@TechGenDM',
  instagram: 'https://www.instagram.com/techgendm',
  facebook:  'https://www.facebook.com/techgendm',
} as const;
