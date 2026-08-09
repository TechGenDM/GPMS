/**
 * GPMS Public Page — Configurable Settings
 * 
 * All public-page-specific content (announcements, social links, 
 * live stream settings) lives here so it can be updated without 
 * touching the component code.
 */

// ─── Live Stream ─────────────────────────────────────────────
export interface LiveStreamConfig {
  /** 'live' | 'upcoming' | 'unavailable' */
  status: 'live' | 'upcoming' | 'unavailable';
  /** YouTube video/stream URL (opened in a new tab when user clicks) */
  youtubeUrl: string;
  /** Optional scheduled date when status is 'upcoming' */
  scheduledDate?: string;
}

export const liveStreamConfig: LiveStreamConfig = {
  status: 'unavailable',
  youtubeUrl: 'https://www.youtube.com/@TechGenDM',
  scheduledDate: undefined,
};

// ─── Announcements ───────────────────────────────────────────
export interface Announcement {
  id: string;
  text: string;
  date: string; // display date string e.g. "13 Aug 2025"
}

export const announcements: Announcement[] = [
  {
    id: '1',
    text: 'Pandit ji 8:30 subha aaynge 14 Tarik ko.',
    date: '13 Aug 2025',
  },
];

// ─── Social Links ────────────────────────────────────────────
// Only links that are provided (non-empty) will be rendered.
// Leave a field empty string '' to hide that icon.
export const socialLinks = {
  youtube:   'https://www.youtube.com/@TechGenDM',
  instagram: 'https://www.instagram.com/techgendm',
  facebook:  'https://www.facebook.com/techgendm',
} as const;
