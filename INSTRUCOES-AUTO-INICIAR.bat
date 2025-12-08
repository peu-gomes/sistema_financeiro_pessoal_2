@echo off
REM ========================================
REM INSTRUCOES PARA AUTO-INICIAR O SERVIDOR
REM ========================================
REM
REM Para fazer o servidor iniciar automaticamente quando o PC liga:
REM
REM 1. OPCAO A - Usar Agendador de Tarefas (Recomendado)
REM    ================================================
REM    a) Pressione WIN + R
REM    b) Digite: taskschd.msc
REM    c) Clique em "Criar Tarefa Basica" (direita)
REM    d) Nome: "Sistema Financeiro Server"
REM    e) Na aba "Disparadores": Clique em "Novo"
REM       - Escolha: "Ao iniciar"
REM       - Marque "Atrasado (adicionar 30 segundos)" para o sistema inicializar
REM    f) Na aba "Acoes": Clique em "Novo"
REM       - Programa: "%~dp0ABRIR-SERVIDOR.bat"
REM    g) Clique em "OK"
REM
REM 2. OPCAO B - Atalho na Pasta Inicializar
REM    ======================================
REM    a) Pressione WIN + R
REM    b) Digite: shell:startup
REM    c) Clique com botao direito nessa pasta (Explorer)
REM    d) Selecione "Novo" > "Atalho"
REM    e) Cole o caminho: %~dp0ABRIR-SERVIDOR.bat
REM    f) Clique em "Avanco" quando criar o atalho
REM    g) Marque a opcao "Executar em modo minimizado"
REM
REM 3. OPCAO C - Adicionar ao Registro (Avancado)
REM    ===========================================
REM    a) Pressione WIN + R
REM    b) Digite: regedit
REM    c) Navegue ate: HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
REM    d) Clique com botao direito > Novo > Valor de Cadeia de Caracteres
REM    e) Nome: SistemaFinanceiroServer
REM    f) Valor: %~dp0ABRIR-SERVIDOR.bat
REM
REM ========================================
REM DICA: Use a OPCAO A (Agendador) para melhor controle
REM ========================================

pause
