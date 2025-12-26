## Como atualizar manualmente o KV (banco de dados/cache) com as configurações dos bancos

Se as sugestões de contas continuam aparecendo incorretamente, pode ser que o KV (banco de dados/cache) não esteja sincronizado com o arquivo `public/data/configuracoes.json`.

Para garantir que o KV use as configurações corretas:

1. Abra o arquivo `public/data/configuracoes.json` e copie todo o conteúdo.
2. Use uma ferramenta como [Insomnia](https://insomnia.rest/) ou [Postman](https://www.postman.com/) para fazer uma requisição HTTP PUT para a API:
	- URL: `http://localhost:3000/api/configuracoes` (ajuste a porta se necessário)
	- Método: PUT
	- Body: Cole o conteúdo do arquivo `configuracoes.json` como JSON
	- Headers: `Content-Type: application/json`
3. Envie a requisição. Se tudo estiver correto, a resposta será o JSON atualizado.
4. Recarregue o sistema e teste a importação novamente.

**Dica:** Se estiver em produção, use a URL do seu servidor.

Isso força o KV a usar exatamente o que está no arquivo, corrigindo problemas de sincronização entre o banco de dados e o arquivo local.
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
