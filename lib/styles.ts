/**
 * lib/styles.ts
 * Classes Tailwind repetidas extraídas para reutilização
 * Evita duplicação de código e facilita manutenção
 */

// ========== CARDS & CONTAINERS ==========
export const CARD_BASE = 'bg-white rounded-lg shadow p-4';
export const CARD_ELEVATED = 'bg-white rounded-lg shadow-md p-6';
export const CARD_BORDER = 'bg-white rounded-lg border border-gray-200 shadow-sm p-4';
export const CARD_HOVER = 'hover:shadow-md transition-shadow';
export const CARD_CLICK = 'w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors';

// ========== BOTÕES ==========
export const BTN_BASE = 'px-4 py-2 rounded-lg transition-colors font-medium';
export const BTN_PRIMARY = `${BTN_BASE} bg-blue-600 text-white hover:bg-blue-700`;
export const BTN_SECONDARY = `${BTN_BASE} border border-gray-300 text-gray-700 hover:bg-gray-50`;
export const BTN_DANGER = `${BTN_BASE} bg-red-600 text-white hover:bg-red-700`;
export const BTN_SUCCESS = `${BTN_BASE} bg-green-600 text-white hover:bg-green-700`;
export const BTN_ICON = 'p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors';
export const BTN_ICON_BLUE = 'p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors';
export const BTN_ICON_RED = 'p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors';
export const BTN_SMALL_ICON = 'p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors';

// ========== INPUTS & FORMS ==========
export const INPUT_BASE = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';
export const INPUT_ERROR = 'w-full px-3 py-2 border border-red-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white';
export const SELECT_BASE = `${INPUT_BASE}`;
export const TEXTAREA_BASE = `${INPUT_BASE} resize-none`;

// ========== TIPOGRAFIA ==========
export const TEXT_XS = 'text-xs';
export const TEXT_SM = 'text-sm';
export const TEXT_BASE = 'text-base';
export const TEXT_LG = 'text-lg';
export const TEXT_XL = 'text-xl';
export const TEXT_2XL = 'text-2xl';

export const FONT_LIGHT = 'font-light';
export const FONT_NORMAL = 'font-normal';
export const FONT_MEDIUM = 'font-medium';
export const FONT_SEMIBOLD = 'font-semibold';
export const FONT_BOLD = 'font-bold';

export const TEXT_GRAY_600 = 'text-gray-600';
export const TEXT_GRAY_700 = 'text-gray-700';
export const TEXT_GRAY_800 = 'text-gray-800';
export const TEXT_GRAY_900 = 'text-gray-900';

export const TEXT_MUTED = 'text-gray-500 text-xs';
export const TEXT_LABEL = 'text-sm font-medium text-gray-700';

// ========== CORES DE STATUS ==========
export const STATUS_SUCCESS = 'text-green-600';
export const STATUS_ERROR = 'text-red-600';
export const STATUS_WARNING = 'text-yellow-600';
export const STATUS_INFO = 'text-blue-600';

export const BG_SUCCESS = 'bg-green-50 border-l-4 border-green-500';
export const BG_ERROR = 'bg-red-50 border-l-4 border-red-500';
export const BG_WARNING = 'bg-yellow-50 border-l-4 border-yellow-500';
export const BG_INFO = 'bg-blue-50 border-l-4 border-blue-500';

// ========== BADGES & LABELS ==========
export const BADGE_BASE = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
export const BADGE_SUCCESS = `${BADGE_BASE} bg-green-100 text-green-700`;
export const BADGE_ERROR = `${BADGE_BASE} bg-red-100 text-red-700`;
export const BADGE_WARNING = `${BADGE_BASE} bg-yellow-100 text-yellow-700`;
export const BADGE_INFO = `${BADGE_BASE} bg-blue-100 text-blue-700`;
export const BADGE_GRAY = `${BADGE_BASE} bg-gray-100 text-gray-700`;

// ========== ALERTAS ==========
export const ALERT_SUCCESS = 'p-4 bg-green-50 border border-green-200 rounded-lg';
export const ALERT_ERROR = 'p-4 bg-red-50 border border-red-200 rounded-lg';
export const ALERT_WARNING = 'p-4 bg-yellow-50 border border-yellow-200 rounded-lg';
export const ALERT_INFO = 'p-4 bg-blue-50 border border-blue-200 rounded-lg';

export const ALERT_TEXT_SUCCESS = 'text-green-800';
export const ALERT_TEXT_ERROR = 'text-red-800';
export const ALERT_TEXT_WARNING = 'text-yellow-800';
export const ALERT_TEXT_INFO = 'text-blue-800';

// ========== MODAIS ==========
export const MODAL_OVERLAY = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
export const MODAL_CONTENT = 'bg-white rounded-lg shadow-lg max-w-md w-full';
export const MODAL_HEADER = 'sticky top-0 bg-white border-b border-gray-200 p-6 z-10';
export const MODAL_BODY = 'p-6 space-y-4';
export const MODAL_FOOTER = 'flex gap-3 pt-6 border-t border-gray-200';

// ========== TABELAS ==========
export const TABLE_HEADER = 'bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b border-gray-200';
export const TABLE_CELL = 'px-4 py-3 text-sm text-gray-900 border-b border-gray-200';
export const TABLE_ROW = 'border-b border-gray-200 hover:bg-gray-50 transition-colors';

// ========== ESPAÇAMENTO ==========
export const SPACE_X_2 = 'space-x-2';
export const SPACE_X_3 = 'space-x-3';
export const SPACE_X_4 = 'space-x-4';
export const SPACE_Y_2 = 'space-y-2';
export const SPACE_Y_3 = 'space-y-3';
export const SPACE_Y_4 = 'space-y-4';
export const SPACE_Y_6 = 'space-y-6';

export const GAP_2 = 'gap-2';
export const GAP_3 = 'gap-3';
export const GAP_4 = 'gap-4';
export const GAP_6 = 'gap-6';

// ========== PADDING ==========
export const P_2 = 'p-2';
export const P_3 = 'p-3';
export const P_4 = 'p-4';
export const P_6 = 'p-6';
export const PX_4 = 'px-4';
export const PX_6 = 'px-6';
export const PY_2 = 'py-2';
export const PY_3 = 'py-3';
export const PY_6 = 'py-6';

// ========== MARGIN ==========
export const M_0 = 'm-0';
export const MB_1 = 'mb-1';
export const MB_2 = 'mb-2';
export const MB_4 = 'mb-4';
export const MB_6 = 'mb-6';
export const MT_1 = 'mt-1';
export const MT_2 = 'mt-2';
export const MT_4 = 'mt-4';
export const ML_1 = 'ml-1';
export const ML_2 = 'ml-2';
export const ML_4 = 'ml-4';

// ========== FLEXBOX ==========
export const FLEX_CENTER = 'flex items-center justify-center';
export const FLEX_BETWEEN = 'flex items-center justify-between';
export const FLEX_START = 'flex items-start justify-between';
export const FLEX_COL = 'flex flex-col';
export const FLEX_COL_MD_ROW = 'flex flex-col md:flex-row';
export const FLEX_WRAP = 'flex flex-wrap';
export const ITEMS_CENTER = 'items-center';
export const JUSTIFY_BETWEEN = 'justify-between';
export const JUSTIFY_CENTER = 'justify-center';

// ========== GRID ==========
export const GRID_2_COL = 'grid grid-cols-2';
export const GRID_3_COL = 'grid grid-cols-3';
export const GRID_2_MD_3_LG = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
export const GRID_4_COL = 'grid grid-cols-4 gap-4';

// ========== TRANSIÇÕES & HOVER ==========
export const TRANSITION_COLORS = 'transition-colors';
export const TRANSITION_ALL = 'transition-all';
export const TRANSITION_SHADOW = 'transition-shadow';
export const TRANSITION_TRANSFORM = 'transition-transform';
export const DURATION_300 = 'duration-300';
export const DURATION_500 = 'duration-500';

// ========== BORDERS ==========
export const BORDER_BASE = 'border border-gray-200';
export const BORDER_B = 'border-b border-gray-200';
export const BORDER_L_4 = 'border-l-4';
export const BORDER_L_GREEN = 'border-l-4 border-green-500';
export const BORDER_L_RED = 'border-l-4 border-red-500';
export const BORDER_L_YELLOW = 'border-l-4 border-yellow-500';
export const BORDER_L_BLUE = 'border-l-4 border-blue-500';
export const ROUNDED_LG = 'rounded-lg';
export const ROUNDED_FULL = 'rounded-full';

// ========== SOMBRAS ==========
export const SHADOW_SM = 'shadow-sm';
export const SHADOW = 'shadow';
export const SHADOW_MD = 'shadow-md';
export const SHADOW_LG = 'shadow-lg';
export const SHADOW_XL = 'shadow-xl';

// ========== RESPONSIVIDADE ==========
export const RESPONSIVE_GRID = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
export const RESPONSIVE_FLEX = 'flex flex-col md:flex-row md:items-center md:justify-between gap-4';
export const HIDDEN_MOBILE = 'hidden md:block';
export const HIDDEN_DESKTOP = 'md:hidden';
export const FULL_WIDTH = 'w-full';
export const MAX_W_CONTAINER = 'max-w-7xl mx-auto px-4';

// ========== ÍCONES ==========
export const ICON_SIZE_3 = 'w-3 h-3';
export const ICON_SIZE_4 = 'w-4 h-4';
export const ICON_SIZE_5 = 'w-5 h-5';
export const ICON_SIZE_6 = 'w-6 h-6';
export const ICON_SIZE_8 = 'w-8 h-8';
export const ICON_SIZE_10 = 'w-10 h-10';
export const ICON_SIZE_12 = 'w-12 h-12';
export const ICON_BASE = 'fill-none stroke-currentColor';

// ========== CIRCULAR ELEMENTS ==========
export const CIRCLE_SM = 'w-10 h-10 rounded-full';
export const CIRCLE_MD = 'w-12 h-12 rounded-full';
export const CIRCLE_LG = 'w-16 h-16 rounded-full';
export const CIRCLE_FLEX = `${CIRCLE_SM} flex items-center justify-center`;

// ========== BACKGROUNDS COLORIDOS ==========
export const BG_BLUE = 'p-2 bg-blue-100 rounded-lg';
export const BG_RED = 'p-2 bg-red-100 rounded-lg';
export const BG_GREEN = 'p-2 bg-green-100 rounded-lg';
export const BG_YELLOW = 'p-2 bg-yellow-100 rounded-lg';
export const BG_PURPLE = 'p-2 bg-purple-100 rounded-lg';
export const BG_ORANGE = 'p-2 bg-orange-100 rounded-lg';

// ========== TEXT COLORS COLORIDOS ==========
export const TEXT_BLUE = 'text-blue-600';
export const TEXT_RED = 'text-red-600';
export const TEXT_GREEN = 'text-green-600';
export const TEXT_YELLOW = 'text-yellow-600';
export const TEXT_PURPLE = 'text-purple-600';
export const TEXT_ORANGE = 'text-orange-600';

// ========== UTILITÁRIOS ==========
export const TRUNCATE = 'truncate';
export const TRUNCATE_2 = 'line-clamp-2';
export const MIN_W_0 = 'min-w-0';
export const FLEX_1 = 'flex-1';
export const FLEX_SHRINK_0 = 'flex-shrink-0';
export const OVERFLOW_HIDDEN = 'overflow-hidden';
export const OVERFLOW_X_AUTO = 'overflow-x-auto';
export const WHITESPACE_NOWRAP = 'whitespace-nowrap';
export const Z_40 = 'z-40';
export const Z_50 = 'z-50';
export const FIXED_BOTTOM = 'fixed bottom-0 left-0 right-0';
export const ABSOLUTE_CENTER = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';

// ========== COMBINAÇÕES FREQUENTES ==========
export const EXPANDABLE_SECTION = 'w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer';
export const STAT_CARD = 'bg-white rounded-lg shadow p-4 flex items-center gap-3';
export const FORM_GROUP = 'flex flex-col gap-2';
export const ITEM_ROW = 'flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors';
export const ICON_WITH_LABEL = 'flex items-center gap-3';
export const HEADER_TITLE = 'text-lg font-semibold text-gray-800';
export const SUBHEADER = 'text-sm text-gray-600 mt-1';
export const STICKY_HEADER = 'sticky top-0 bg-white border-b border-gray-200 z-10';
export const FOOTER_ACTIONS = 'flex gap-2 justify-end';

// ========== DARK MODE UTILITIES ==========
export const DARK_BG = 'dark:bg-gray-800';
export const DARK_BORDER = 'dark:border-gray-700';
export const DARK_TEXT = 'dark:text-gray-200';
export const DARK_TEXT_MUTED = 'dark:text-gray-400';

// ========== ANIMAÇÕES ==========
export const ANIMATE_SPIN = 'animate-spin';
export const ANIMATE_PULSE = 'animate-pulse';
export const ANIMATE_BOUNCE = 'animate-bounce';

// ========== FUNÇÕES AUXILIARES ==========

/**
 * Combina múltiplas classes evitando conflitos
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Retorna classe de cor baseada em valor numérico
 */
export const getStatusColor = (value: number, threshold: number = 100): string => {
  if (value > threshold + 20) return 'text-red-600';
  if (value > threshold) return 'text-yellow-600';
  return 'text-green-600';
};

/**
 * Retorna classe de background baseada em tipo
 */
export const getTypeBackground = (type: 'success' | 'error' | 'warning' | 'info'): string => {
  const backgrounds: Record<string, string> = {
    success: 'bg-green-50 border-l-4 border-green-500',
    error: 'bg-red-50 border-l-4 border-red-500',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500',
    info: 'bg-blue-50 border-l-4 border-blue-500',
  };
  return backgrounds[type] || backgrounds.info;
};

/**
 * Retorna classe de texto baseada em tipo
 */
export const getTypeText = (type: 'success' | 'error' | 'warning' | 'info'): string => {
  const texts: Record<string, string> = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };
  return texts[type] || texts.info;
};

/**
 * Retorna classes de badge baseadas em tipo
 */
export const getBadgeClasses = (type: 'success' | 'error' | 'warning' | 'info' | 'default'): string => {
  const badges: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    info: 'bg-blue-100 text-blue-700',
    default: 'bg-gray-100 text-gray-700',
  };
  return `${BADGE_BASE} ${badges[type] || badges.default}`;
};

/**
 * Retorna classe de cor financeira
 */
export const getFinancialColor = (type: 'receita' | 'despesa' | 'transferencia'): string => {
  const colors: Record<string, string> = {
    receita: 'text-green-600',
    despesa: 'text-red-600',
    transferencia: 'text-blue-600',
  };
  return colors[type] || 'text-gray-600';
};
