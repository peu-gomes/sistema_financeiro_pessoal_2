# 🚀 Como Iniciar o Servidor

## Opção 1: Duplo clique (Mais Fácil)
```
Clique duas vezes em: start-dev.bat
```
Isso vai:
- ✅ Instalar dependências (se necessário)
- ✅ Iniciar o servidor na porta 3001
- ✅ Abrir automaticamente em http://localhost:3001

## Opção 2: PowerShell
```powershell
.\start-dev.ps1
```

## Opção 3: Terminal/CMD
```cmd
npm run dev
```

## Opção 4: VS Code Debugger
1. Pressione `F5` ou vá em **Run → Start Debugging**
2. Selecione "Dev Server"
3. O servidor inicia no terminal integrado

## Opção 5: VS Code Tasks
1. Pressione `Ctrl+Shift+B`
2. Selecione a tarefa de build/dev

---

## URLs
- 🌐 **Local**: http://localhost:3001
- 🖥️ **Rede**: http://192.168.0.104:3001

## Parar o Servidor
- Pressione `Ctrl+C` no terminal
- Ou feche o terminal

## Troubleshooting

### Porta 3001 já está em uso
```powershell
# Matar processo na porta 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### npm não reconhecido
- Reinstale o Node.js
- Verifique se `node --version` funciona no terminal

### Dependências faltando
```powershell
npm install
```

---

**💡 Dica**: Coloque `start-dev.bat` na pasta de Inicialização do Windows para abrir ao ligar o PC!

Caminho: `C:\Users\[SEU_USUARIO]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`
