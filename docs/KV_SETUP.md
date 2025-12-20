Vercel KV – Configuração

Visão geral
- Este projeto agora utiliza o Vercel KV para persistir dados online (Configurações, Plano de Contas, Lançamentos e Orçamentos).
- Na primeira leitura (GET), se o KV estiver vazio, os dados são carregados de `public/data/*.json` e gravados no KV (se as variáveis KV estiverem configuradas). Escrita (PUT/POST/PATCH/DELETE) requer KV configurado.

Passo a passo (Vercel)
1) No Dashboard do Vercel: Storage → Add → KV. Vincule o KV ao projeto.
2) O Vercel adicionará automaticamente as variáveis de ambiente:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - (opcional) `KV_REST_API_READ_ONLY_TOKEN`
3) Faça um redeploy da aplicação.

Desenvolvimento local (opcional)
- Para que alterações (escritas) funcionem em dev, defina as mesmas variáveis em `.env.local`:

```
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
# KV_REST_API_READ_ONLY_TOKEN=...
```

Endereços de API
- `GET /api/configuracoes` | `PUT /api/configuracoes`
- `GET /api/contas` | `PUT /api/contas`
- `GET /api/lancamentos` | `POST /api/lancamentos` | `PATCH /api/lancamentos` | `DELETE /api/lancamentos`
- `POST /api/lancamentos/import`
- `GET /api/orcamentos` | `PUT /api/orcamentos` | `DELETE /api/orcamentos`

Observações
- Se o KV não estiver configurado, leituras GET ainda retornam dados dos arquivos públicos, mas escritas retornarão erro 500 com mensagem de KV não configurado.
- O formato de retorno de `GET /api/contas` é um array de contas (antes podia ser `{ contas: [] }`). Os consumidores foram atualizados para lidar com isso.
