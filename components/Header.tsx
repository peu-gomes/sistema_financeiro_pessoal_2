'use client';

import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { tema, setTema } = useTheme();
  const pathname = usePathname();

  // Ordem e rótulos alinhados com a navegação global (desktop/mobile):
  // Dashboard, Plano de Contas, Planejamento, Lançamentos, Configurações
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/plano-de-contas', label: 'Plano de Contas' },
    { href: '/planejamento', label: 'Planejamento' },
    { href: '/lancamentos', label: 'Lançamentos' },
    { href: '/configuracoes', label: 'Configurações' },
  ];

  return (
    <header className="hidden md:block bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <nav className="flex gap-1 border-b border-gray-200 flex-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                pathname === item.href
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={tema === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {tema === 'dark' ? (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
