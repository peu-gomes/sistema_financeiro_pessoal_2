'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getConfiguracoes, saveConfiguracoes } from '@/lib/api';

type Tema = 'light' | 'dark' | 'system';

interface ThemeContextType {
  tema: Tema;
  setTema: (tema: Tema) => void;
  temaAtivo: 'light' | 'dark'; // Tema efetivamente aplicado (resolve 'system')
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<Tema>('light');
  const [temaAtivo, setTemaAtivo] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Resolve tema 'system' para light ou dark
  const resolverTema = (tema: Tema): 'light' | 'dark' => {
    if (tema === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return tema;
  };

  // Aplica tema no HTML
  const aplicarTema = (temaResolvido: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(temaResolvido);
    setTemaAtivo(temaResolvido);
  };

  // Carrega tema do banco de dados
  useEffect(() => {
    const carregarTema = async () => {
      try {
        const config = await getConfiguracoes();
        const temaCarregado = config.tema || 'light';
        setTemaState(temaCarregado);
        aplicarTema(resolverTema(temaCarregado));
        setMounted(true);
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
        setMounted(true);
      }
    };

    carregarTema();
  }, []);

  // Observa mudanças na preferência do sistema (quando tema = 'system')
  useEffect(() => {
    if (!mounted || tema !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      aplicarTema(resolverTema('system'));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [tema, mounted]);

  // Salva tema no banco de dados
  const setTema = async (novoTema: Tema) => {
    // Atualiza estado
    setTemaState(novoTema);
    
    // Resolve e aplica tema IMEDIATAMENTE
    const temaResolvido = resolverTema(novoTema);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(temaResolvido);
    setTemaAtivo(temaResolvido);
    
    console.log('Tema alterado para:', novoTema, '→', temaResolvido);
    console.log('Classes no HTML:', root.className);

    // Salva no banco
    try {
      const config = await getConfiguracoes();
      await saveConfiguracoes({
        ...config,
        tema: novoTema,
      });
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ tema, setTema, temaAtivo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
