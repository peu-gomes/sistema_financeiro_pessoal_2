/**
 * Design System - Paleta de cores, tamanhos e estilos reutilizáveis
 * Centraliza todo o padrão visual da aplicação
 */

// ========== CORES ==========
export const COLORS = {
  // Cores Primárias
  primary: '#2563eb',      // Azul
  primaryLight: '#dbeafe', // Azul claro
  primaryDark: '#1e40af',  // Azul escuro

  // Cores de Status
  success: '#10b981',      // Verde
  successLight: '#d1fae5',
  successDark: '#047857',

  error: '#ef4444',        // Vermelho
  errorLight: '#fee2e2',
  errorDark: '#dc2626',

  warning: '#f59e0b',      // Âmbar
  warningLight: '#fef3c7',
  warningDark: '#d97706',

  info: '#3b82f6',         // Info
  infoLight: '#eff6ff',
  infoDark: '#1e40af',

  // Cores Neutras
  white: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Cores Financeiras
  receita: '#10b981',      // Verde
  despesa: '#ef4444',      // Vermelho
  transferencia: '#3b82f6', // Azul
};

// ========== TIPOGRAFIA ==========
export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// ========== ESPAÇAMENTO ==========
export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
};

// ========== BORDER RADIUS ==========
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
};

// ========== SOMBRAS ==========
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

// ========== TRANSIÇÕES ==========
export const TRANSITIONS = {
  fast: 'transition-colors duration-150',
  base: 'transition-all duration-300',
  slow: 'transition-all duration-500',
};

// ========== COMPONENTES - BUTTONS ==========
export const BUTTON_STYLES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
  success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  warning: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
};

export const BUTTON_SIZES = {
  xs: 'px-2 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
  xl: 'px-8 py-4 text-base rounded-lg',
};

// ========== COMPONENTES - CARDS ==========
export const CARD_STYLES = {
  default: 'bg-white border border-gray-200 rounded-lg shadow-sm p-6',
  elevated: 'bg-white rounded-lg shadow-md p-6',
  bordered: 'bg-white border-2 border-gray-200 rounded-lg p-6',
  subtle: 'bg-gray-50 border border-gray-200 rounded-lg p-6',
};

// ========== COMPONENTES - INPUTS ==========
export const INPUT_STYLES =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';

export const INPUT_ERROR =
  'w-full px-3 py-2 border border-red-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white';

// ========== COMPONENTES - MODALS ==========
export const MODAL_OVERLAY = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

export const MODAL_CONTENT = 'bg-white rounded-lg shadow-xl max-w-md w-full';

export const MODAL_HEADER = 'sticky top-0 bg-white border-b border-gray-200 p-6 z-10';

export const MODAL_BODY = 'p-6 space-y-4';

export const MODAL_FOOTER = 'flex gap-3 pt-6 border-t border-gray-200';

// ========== COMPONENTES - BADGES ==========
export const BADGE_STYLES = {
  primary: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700',
  success: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700',
  error: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700',
  warning: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700',
  gray: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700',
};

// ========== COMPONENTES - ALERTS ==========
export const ALERT_STYLES = {
  success: 'bg-green-50 border border-green-200 rounded-lg p-4',
  error: 'bg-red-50 border border-red-200 rounded-lg p-4',
  warning: 'bg-amber-50 border border-amber-200 rounded-lg p-4',
  info: 'bg-blue-50 border border-blue-200 rounded-lg p-4',
};

export const ALERT_TEXT = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-amber-800',
  info: 'text-blue-800',
};

// ========== COMPONENTES - TABELAS ==========
export const TABLE_HEADER = 'bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b border-gray-200';

export const TABLE_CELL = 'px-4 py-3 text-sm text-gray-900 border-b border-gray-200';

export const TABLE_ROW_HOVER = 'hover:bg-gray-50 transition-colors';

// ========== COMPONENTES - NAVEGAÇÃO ==========
export const NAV_LINK_ACTIVE = 'px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600';

export const NAV_LINK_INACTIVE = 'px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300';

// ========== RESPONSIVE PATTERNS ==========
export const RESPONSIVE = {
  container: 'max-w-7xl mx-auto px-4',
  gridCols: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  flexResponsive: 'flex flex-col md:flex-row items-center justify-between gap-4',
};

// ========== UTILITÁRIOS ==========
export const UTILITIES = {
  truncate: 'truncate',
  truncateLines: (lines: number) => `line-clamp-${lines}`,
  hideScrollbar: 'scrollbar-hide',
  centered: 'flex items-center justify-center',
  absoluteCenter: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
};
