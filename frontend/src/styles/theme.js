// shared UI theme tokens — frontend only, no backend coupling
export const COLORS = {
  primary: '#0891b2',
  primaryDark: '#0f172a',
  accent: '#06d6a0',
  danger: '#ef4444',
  mutedBg: '#f1f5f9',
};

// subtle fade-in util reused by dashboards
export const fadeIn =
  '@keyframes mfFadeIn {from {opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}';
