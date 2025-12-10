# Sistema de Classificação Inteligente de Transações

## Visão Geral

O sistema agora possui uma **classificação automática inteligente** para transações bancárias, utilizando dois mecanismos principais:

1. **Regras Configuráveis** - Palavras-chave para categorizar despesas/receitas
2. **Inteligência Artificial** - Aprendizado a partir do histórico de transações

## Como Funciona

### 1. Classificação por Regras

Quando você importa um extrato bancário, o sistema:

1. Lê o **banco selecionado** e suas **regras de classificação**
2. Processa cada transação para encontrar **palavras-chave** no histórico
3. Se encontrar uma correspondência, usa a **conta configurada** para aquela regra
4. Ordena as regras por **prioridade** (número menor = maior prioridade)

**Exemplo de Regra:**
- **Tipo:** Saída (Despesa)
- **Palavras-chave:** supermercado, mercado, alimentação, padaria
- **Conta Destino:** 5.3.01.001 (Alimentação)
- **Prioridade:** 1

Se uma transação contiver "Supermercado ABC", será classificada automaticamente em "Alimentação".

### 2. Inteligência Artificial - Análise de Histórico

Se não houver correspondência de regra, o sistema:

1. Busca **lançamentos anteriores similares** analisando:
   - Palavras-chave comuns na descrição
   - Valores próximos (até 30% de diferença)

2. Calcula um **nível de confiança** baseado em:
   - Quantas transações similares foram encontradas
   - Com qual frequência cada conta foi usada para aquele tipo

3. Retorna a conta mais frequente com indicador visual

**Exemplo:**
- Se você importou 5 transações com "Amazon" categorizadas em "Serviços" anteriormente
- Uma nova transação com "Amazon" será sugerida para "Serviços" com 80% de confiança

### 3. Indicadores de Confiança

No modal de importação, cada sugestão mostra um ícone:

- **✅ Alta Confiança (90%+)** - Regra encontrada ou histórico muito consistente
- **🎯 Boa Confiança (70-89%)** - Padrão detectado no histórico
- **⚠️ Baixa Confiança (<70%)** - Menos certeza, mas sugestão disponível
- **❓ Sem Sugestão** - Nenhuma regra ou histórico similar encontrado

## Configurando Bancos

### Acessar Configuração

1. Vá para **Bancos** no menu superior
2. Selecione um banco na lista

### Informações Básicas

Para cada banco, configure:

- **Código da Conta:** Conta no plano de contas (ex: 1.1.01.001)
- **Conta Padrão Receita:** Onde entradas são categorizadas se não houver regra (ex: 4.1.01.001)
- **Conta Padrão Despesa:** Onde saídas são categorizadas se não houver regra (ex: 5.99.99.999)

### Adicionando Regras de Classificação

1. Na tela de configuração do banco, clique **+ Adicionar Regra**
2. Configure:
   - **Tipo:** Entrada ou Saída
   - **Palavras-chave:** Digite e clique + (separe por categorias lógicas)
   - **Conta Destino:** Código da conta (ex: 5.3.01.001)
   - **Prioridade:** 1 = máxima prioridade
   - **Ativa:** Checkbox para habilitar/desabilitar

3. Clique **Salvar**

### Gerenciando Regras

- **Editar:** Remova a regra e crie uma nova (em futuras versões)
- **Remover:** Clique ✕ ao lado da regra
- **Ativar/Desativar:** Será adicionado em próximas atualizações

## Fluxo de Importação

```
1. Selecione o Banco
   ↓
2. Envie arquivo CSV
   ↓
3. Sistema processa cada linha:
   - Tenta corresponder com Regra Configurada
   - Se não encontrar, busca no Histórico (IA)
   - Se ainda não encontrar, usa Conta Padrão
   ↓
4. Preview mostra Sugestões com Confiança
   ↓
5. Revise as classificações (em futuras versões)
   ↓
6. Importar cria os lançamentos com contas sugeridas
```

## Formato CSV Esperado

```csv
data,descrição,valor,tipo
2025-12-09,Supermercado ABC,150.50,saida
2025-12-08,Salário,5000.00,entrada
```

Colunas:
- **data:** DD/MM/YYYY ou YYYY-MM-DD
- **descrição:** Texto que será usado para classificação
- **valor:** Número (ponto para decimal)
- **tipo:** "entrada" ou "saida" (opcional, será detectado pelo valor)

## Dicas de Uso

### Maximizar Confiança da IA

1. **Seja consistente** ao registrar transações similares
2. **Use nomes únicos** para empresas (ex: sempre "Amazon" e não "Amazon Prime", "AMZ", etc)
3. **Categorize manualmente** as primeiras transações para treinar a IA

### Otimizar Regras

1. **Agrupe palavras por categoria** (ex: supermercado, mercado, padaria → Alimentação)
2. **Use sinônimos** (mercadinho, superm, etc)
3. **Ordene por prioridade** (regras mais específicas primeiro)
4. **Desative regras obsoletas** em vez de deletar

### Revisar Sugestões

Antes de importar:
- Verifique as transações com **⚠️ Baixa Confiança**
- Considere adicionar novas regras se vir padrões repetidos
- Edite classificações erradas após importar (próxima versão)

## Melhorias Futuras

- [ ] Editar sugestões antes de importar
- [ ] Undo/Redo para importações
- [ ] Histórico de importações
- [ ] Exportar/importar configuração de bancos
- [ ] Análise de padrões de gasto
- [ ] Alertas de transações anormais
- [ ] Suporte a OFX e QIF além de CSV
- [ ] Detecção automática de duplicatas
- [ ] API de IA para categorização com modelos treinados

## Troubleshooting

### Transações não estão sendo categorizadas

- Verifique se o banco está marcado como "Padrão" na importação
- Confirme que a descrição contém as palavras-chave configuradas
- Considere adicionar variações das palavras-chave (caso, caracteres especiais)

### Muitas sugestões incorretas

- Aumente a prioridade de regras mais específicas
- Remova regras muito genéricas
- Compile mais histórico antes de usar IA (mínimo 5-10 transações similares)

### Quero resetar tudo

- Remova todas as regras de um banco
- Configure novas palavras-chave e contas
- Delete o arquivo de importação e tente novamente

## Exemplo Completo

### Configuração do Banco do Brasil

**Informações:**
- Código: 1.1.01.001 - Caixa
- Conta Padrão Receita: 4.1.01.001 (Salário)
- Conta Padrão Despesa: 5.99.99.999 (Diverso)

**Regras:**

| Prioridade | Tipo | Palavras-chave | Conta | Descrição |
|-----------|------|---|---|---|
| 1 | Saída | supermercado, mercado, padaria | 5.3.01.001 | Alimentação |
| 2 | Saída | combustível, posto, gasolina | 5.3.02.001 | Transporte |
| 3 | Saída | restaurante, pizza, delivery | 5.3.01.002 | Alimentação Fora |
| 4 | Saída | energia, cpfl, enel | 5.3.03.001 | Utilidades |
| 5 | Entrada | salário, pagamento | 4.1.01.001 | Salário |

### Importação de Exemplo

```csv
data,descrição,valor,tipo
2025-12-15,MERCADO NEVES,245.80,saida
2025-12-14,PIZZARIA GIOVANNI,89.50,saida
2025-12-13,ENEL PAGAMENTO,320.00,saida
2025-12-12,SALÁRIO DEZ 2025,5000.00,entrada
```

**Resultado:**
1. MERCADO NEVES → ✅ 5.3.01.001 (Alimentação) - Regra #1
2. PIZZARIA GIOVANNI → ✅ 5.3.01.002 (Alimentação Fora) - Regra #3
3. ENEL PAGAMENTO → ✅ 5.3.03.001 (Utilidades) - Regra #4
4. SALÁRIO → ✅ 4.1.01.001 (Salário) - Regra #5
