/**
 * Design Tokens
 *
 * Centralized design system tokens extracted from Stripe dashboard style.
 * Use these tokens for consistent styling across the application.
 *
 * Reference: Stripe Dashboard UI (refero.design screenshots)
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // ---------------------------------------------------------------------------
  // Primary Colors
  // ---------------------------------------------------------------------------
  primary: {
    DEFAULT: '#FF5C35',
    hover: '#E64D2E',
    active: '#CC4025',
    light: '#FFF4F1',
    foreground: '#FFFFFF',
  },

  accent: {
    DEFAULT: '#635BFF',
    hover: '#4B45D1',
    active: '#3D38A8',
    light: '#F0EFFF',
    foreground: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // Semantic Colors
  // ---------------------------------------------------------------------------
  success: {
    DEFAULT: '#30D158',
    hover: '#28B84C',
    light: '#ECFDF5',
    dark: '#22A347',
    foreground: '#FFFFFF',
  },

  warning: {
    DEFAULT: '#F5A623',
    hover: '#D4860C',
    light: '#FFFBEB',
    dark: '#B8860B',
    foreground: '#FFFFFF',
  },

  error: {
    DEFAULT: '#DF1B41',
    hover: '#B91635',
    light: '#FEF2F2',
    dark: '#9A1230',
    foreground: '#FFFFFF',
  },

  info: {
    DEFAULT: '#0073E6',
    hover: '#005BB5',
    light: '#EFF6FF',
    dark: '#004A94',
    foreground: '#FFFFFF',
  },

  // ---------------------------------------------------------------------------
  // Chart/Data Visualization Colors
  // ---------------------------------------------------------------------------
  chart: {
    purple: '#9A6AFF',
    yellow: '#FFBB00',
    blue: '#00A4EF',
    green: '#00D4AA',
    orange: '#FF8C00',
    pink: '#FF6B9D',
    gray: '#E3E8EE',
  },

  // ---------------------------------------------------------------------------
  // Neutral/Gray Scale
  // ---------------------------------------------------------------------------
  gray: {
    50: '#F6F9FC',   // Page background
    100: '#F0F3F7',  // Hover backgrounds
    200: '#E3E8EE',  // Borders, disabled backgrounds
    300: '#C1C9D2',  // Light borders
    400: '#A3ACB9',  // Placeholder text
    500: '#8792A2',  // Disabled text, icons
    600: '#697386',  // Muted text, secondary
    700: '#4F5B76',  // Secondary text
    800: '#3C4257',  // Body text
    900: '#1A1F36',  // Section headers
    950: '#0A2540',  // Page titles, primary headings
  },

  // ---------------------------------------------------------------------------
  // Base Colors
  // ---------------------------------------------------------------------------
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // ---------------------------------------------------------------------------
  // Keyword/Status Colors (for rule conditions, etc.)
  // ---------------------------------------------------------------------------
  keyword: {
    request: '#FF5C35',  // Orange - "Request 3DS if..."
    allow: '#30D158',    // Green - "Allow if payment..."
    block: '#DF1B41',    // Red - "Block if..."
    review: '#9A6AFF',   // Purple - "Review if..."
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // ---------------------------------------------------------------------------
  // Font Families
  // ---------------------------------------------------------------------------
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Inter',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(', '),
    mono: [
      'SF Mono',
      'Monaco',
      'Inconsolata',
      'Fira Code',
      'Fira Mono',
      'Roboto Mono',
      'monospace',
    ].join(', '),
  },

  // ---------------------------------------------------------------------------
  // Font Sizes
  // ---------------------------------------------------------------------------
  fontSize: {
    xs: '0.75rem',     // 12px - Small labels, captions
    sm: '0.8125rem',   // 13px - Secondary text
    base: '0.875rem',  // 14px - Body text (default)
    md: '1rem',        // 16px - Subsection headers
    lg: '1.125rem',    // 18px - Section headers
    xl: '1.25rem',     // 20px - Page section titles
    '2xl': '1.5rem',   // 24px - Major headings
    '3xl': '1.75rem',  // 28px - Page titles
    '4xl': '2rem',     // 32px - Large page titles
  },

  // ---------------------------------------------------------------------------
  // Font Weights
  // ---------------------------------------------------------------------------
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // ---------------------------------------------------------------------------
  // Line Heights
  // ---------------------------------------------------------------------------
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // ---------------------------------------------------------------------------
  // Letter Spacing
  // ---------------------------------------------------------------------------
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const;

// =============================================================================
// BORDERS
// =============================================================================

export const borders = {
  // ---------------------------------------------------------------------------
  // Border Radius
  // ---------------------------------------------------------------------------
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',   // Pills, circles
  },

  // ---------------------------------------------------------------------------
  // Border Widths
  // ---------------------------------------------------------------------------
  width: {
    0: '0',
    DEFAULT: '1px',
    2: '2px',
    3: '3px',
    4: '4px',
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  // Focus ring shadows
  focusRing: '0 0 0 3px rgba(99, 91, 255, 0.2)',
  focusRingError: '0 0 0 3px rgba(223, 27, 65, 0.2)',
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  // ---------------------------------------------------------------------------
  // Durations
  // ---------------------------------------------------------------------------
  duration: {
    fast: '100ms',
    DEFAULT: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // ---------------------------------------------------------------------------
  // Timing Functions
  // ---------------------------------------------------------------------------
  timing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',      // Base elevated elements
  20: '20',      // Dropdowns
  30: '30',      // Fixed elements
  40: '40',      // Modals backdrop
  50: '50',      // Modals
  60: '60',      // Popovers
  70: '70',      // Tooltips
  80: '80',      // Notifications/Toasts
  90: '90',      // Maximum
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  // ---------------------------------------------------------------------------
  // Sidebar
  // ---------------------------------------------------------------------------
  sidebar: {
    width: '240px',
    collapsedWidth: '64px',
    itemPadding: '8px 12px',
    activeBorderWidth: '3px',
  },

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  nav: {
    height: '56px',
    mobileHeight: '48px',
  },

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------
  content: {
    maxWidth: '1280px',
    padding: '24px',
    mobilePadding: '16px',
  },

  // ---------------------------------------------------------------------------
  // Cards
  // ---------------------------------------------------------------------------
  card: {
    padding: '16px',
    paddingLg: '24px',
    borderRadius: '8px',
  },
} as const;

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const components = {
  // ---------------------------------------------------------------------------
  // Buttons
  // ---------------------------------------------------------------------------
  button: {
    height: {
      sm: '32px',
      DEFAULT: '36px',
      lg: '40px',
    },
    padding: {
      sm: '0 12px',
      DEFAULT: '0 16px',
      lg: '0 20px',
    },
    fontSize: {
      sm: '13px',
      DEFAULT: '14px',
      lg: '15px',
    },
    borderRadius: '6px',
  },

  // ---------------------------------------------------------------------------
  // Inputs
  // ---------------------------------------------------------------------------
  input: {
    height: {
      sm: '32px',
      DEFAULT: '36px',
      lg: '40px',
    },
    padding: '0 12px',
    fontSize: '14px',
    borderRadius: '6px',
    borderColor: colors.gray[200],
    focusBorderColor: colors.accent.DEFAULT,
    backgroundColor: colors.white,
  },

  // ---------------------------------------------------------------------------
  // Badges
  // ---------------------------------------------------------------------------
  badge: {
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '4px',
  },

  // ---------------------------------------------------------------------------
  // Tables
  // ---------------------------------------------------------------------------
  table: {
    headerFontSize: '11px',
    headerFontWeight: '500',
    headerTextTransform: 'uppercase' as const,
    headerColor: colors.gray[600],
    cellPadding: '12px 16px',
    rowBorderColor: colors.gray[100],
  },

  // ---------------------------------------------------------------------------
  // Tooltips
  // ---------------------------------------------------------------------------
  tooltip: {
    backgroundColor: colors.gray[900],
    textColor: colors.white,
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '4px',
  },

  // ---------------------------------------------------------------------------
  // Progress
  // ---------------------------------------------------------------------------
  progress: {
    height: '8px',
    borderRadius: '4px',
    trackColor: colors.gray[200],
    fillColor: colors.success.DEFAULT,
  },

  // ---------------------------------------------------------------------------
  // Toggle
  // ---------------------------------------------------------------------------
  toggle: {
    width: '44px',
    height: '24px',
    thumbSize: '20px',
    offTrackColor: colors.gray[300],
    onTrackColor: colors.success.DEFAULT,
  },
} as const;

// =============================================================================
// CSS CUSTOM PROPERTIES (for CSS-in-JS or global styles)
// =============================================================================

export const cssVariables = `
:root {
  /* Primary */
  --color-primary: ${colors.primary.DEFAULT};
  --color-primary-hover: ${colors.primary.hover};
  --color-primary-light: ${colors.primary.light};
  --color-primary-foreground: ${colors.primary.foreground};

  --color-accent: ${colors.accent.DEFAULT};
  --color-accent-hover: ${colors.accent.hover};
  --color-accent-light: ${colors.accent.light};
  --color-accent-foreground: ${colors.accent.foreground};

  /* Semantic */
  --color-success: ${colors.success.DEFAULT};
  --color-success-light: ${colors.success.light};
  --color-warning: ${colors.warning.DEFAULT};
  --color-warning-light: ${colors.warning.light};
  --color-error: ${colors.error.DEFAULT};
  --color-error-light: ${colors.error.light};
  --color-info: ${colors.info.DEFAULT};
  --color-info-light: ${colors.info.light};

  /* Chart */
  --color-chart-purple: ${colors.chart.purple};
  --color-chart-yellow: ${colors.chart.yellow};
  --color-chart-blue: ${colors.chart.blue};
  --color-chart-green: ${colors.chart.green};
  --color-chart-orange: ${colors.chart.orange};
  --color-chart-pink: ${colors.chart.pink};

  /* Gray Scale */
  --color-gray-50: ${colors.gray[50]};
  --color-gray-100: ${colors.gray[100]};
  --color-gray-200: ${colors.gray[200]};
  --color-gray-300: ${colors.gray[300]};
  --color-gray-400: ${colors.gray[400]};
  --color-gray-500: ${colors.gray[500]};
  --color-gray-600: ${colors.gray[600]};
  --color-gray-700: ${colors.gray[700]};
  --color-gray-800: ${colors.gray[800]};
  --color-gray-900: ${colors.gray[900]};
  --color-gray-950: ${colors.gray[950]};

  /* Surfaces */
  --color-background: ${colors.gray[50]};
  --color-surface: ${colors.white};
  --color-border: ${colors.gray[200]};
  --color-border-light: ${colors.gray[100]};

  /* Text */
  --color-text-primary: ${colors.gray[950]};
  --color-text-secondary: ${colors.gray[800]};
  --color-text-muted: ${colors.gray[600]};
  --color-text-disabled: ${colors.gray[500]};

  /* Shadows */
  --shadow-xs: ${shadows.xs};
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-focus-ring: ${shadows.focusRing};

  /* Transitions */
  --transition-fast: ${transitions.duration.fast};
  --transition-normal: ${transitions.duration.normal};
  --transition-slow: ${transitions.duration.slow};
  --transition-timing: ${transitions.timing.DEFAULT};

  /* Layout */
  --sidebar-width: ${layout.sidebar.width};
  --nav-height: ${layout.nav.height};
  --content-max-width: ${layout.content.maxWidth};
  --content-padding: ${layout.content.padding};

  /* Border Radius */
  --radius-sm: ${borders.radius.sm};
  --radius-md: ${borders.radius.md};
  --radius-lg: ${borders.radius.lg};
  --radius-full: ${borders.radius.full};
}
`;

// =============================================================================
// EXPORTS
// =============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  layout,
  components,
  cssVariables,
} as const;

export default designTokens;
