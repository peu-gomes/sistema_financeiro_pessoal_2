/**
 * Utilitários para validação e geração de códigos de conta com máscara
 * Exemplo de máscara: "9.9.99.999"
 */

export interface MascaraConfig {
  mascara: string; // ex: "9.9.99.999"
  descricao: string; // descrição legível
}

/**
 * Validar se um código segue a máscara configurada
 * @param codigo - código a validar (ex: "1.2.01.005")
 * @param mascara - padrão de máscara (ex: "9.9.99.999")
 * @returns true se válido, false se inválido
 */
export function validarCodigo(codigo: string, mascara: string): boolean {
  // Remove espaços
  const codigoLimpo = codigo.trim();
  // Separa mascara em partes
  const partesMascara = mascara.split('.');
  const partesCode = codigoLimpo.split('.');
  // Permite códigos parciais: número de partes <= máscara
  if (partesCode.length > partesMascara.length) {
    return false;
  }
  // Valida cada parte existente
  for (let i = 0; i < partesCode.length; i++) {
    const tamMascara = partesMascara[i].length;
    const tamCode = partesCode[i].length;
    // Deve ter mesmo tamanho (se máscara diz 99, deve ter 2 dígitos)
    if (tamCode !== tamMascara) {
      return false;
    }
    // Deve ser números
    if (!/^\d+$/.test(partesCode[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Gerar próximo código válido baseado na máscara
 * @param codigoPai - código pai para referência (vazio '' para conta raiz)
 * @param codigosExistentes - array com todos os códigos já existentes
 * @param mascara - padrão de máscara
 * @returns novo código formatado
 */
export function gerarProximoCodigo(
  codigoPai: string,
  codigosExistentes: string[],
  mascara: string
): string {
  const partesMascara = mascara.split('.');
  const isContaRaiz = codigoPai === '' || codigoPai === undefined || codigoPai === null;
  const partesCodigoPai = isContaRaiz ? [] : codigoPai.split('.');
  const nivelAtual = isContaRaiz ? 0 : partesCodigoPai.length;
  
  // Verifica se ainda pode adicionar níveis
  if (nivelAtual >= partesMascara.length) {
    throw new Error('Máximo de níveis atingido');
  }
  
  // Encontra o maior número usado nesse nível (filhos diretos)
  let maiorNumero = 0;
  
  for (const codigoExistente of codigosExistentes) {
    const partesExistente = codigoExistente.split('.');
    
    if (isContaRaiz) {
      // Para conta raiz, pega direto o primeiro número
      if (partesExistente.length === 1) {
        const numero = parseInt(partesExistente[0], 10);
        if (numero > maiorNumero) {
          maiorNumero = numero;
        }
      }
    } else {
      // Verifica se é filho direto (mesmo prefixo + 1 nível a mais)
      if (partesExistente.length === nivelAtual + 1) {
        const prefixoIgual = partesExistente.slice(0, nivelAtual).join('.') === codigoPai;
        
        if (prefixoIgual) {
          const ultimaParte = partesExistente[nivelAtual];
          const numero = parseInt(ultimaParte, 10);
          if (numero > maiorNumero) {
            maiorNumero = numero;
          }
        }
      }
    }
  }
  
  // Próximo número
  const proximoNumero = maiorNumero + 1;
  const tamanho = partesMascara[nivelAtual].length;
  const proximaParte = String(proximoNumero).padStart(tamanho, '0');
  
  if (isContaRaiz) {
    return proximaParte;
  }
  
  return `${codigoPai}.${proximaParte}`;
}

/**
 * Obter template/máscara legível
 * @param mascara - padrão (ex: "9.9.99.999")
 * @returns descrição legível
 */
export function getMascaraDescricao(mascara: string): string {
  const partes = mascara.split('.');
  const descricoes = [
    'Classe',
    'Subclasse',
    'Grupo',
    'Subgrupo',
    'Conta',
    'Subconta'
  ];
  
  return partes
    .map((parte, idx) => {
      const tam = parte.length;
      return `${descricoes[idx] || 'Nível ' + (idx + 1)} (${tam} dígito${tam > 1 ? 's' : ''})`;
    })
    .join(' → ');
}

/**
 * Extrair nível da profundidade do código
 * @param codigo - código completo
 * @returns número do nível (0 = raiz, 1 = primeira subconta, etc)
 */
export function getNivelCodigo(codigo: string): number {
  return codigo.split('.').length - 1;
}

/**
 * Obter código pai de um código
 * @param codigo - código completo (ex: "1.2.01.005")
 * @returns código pai (ex: "1.2.01") ou null se for raiz
 */
export function getCodigoPai(codigo: string): string | null {
  const partes = codigo.split('.');
  if (partes.length <= 1) return null;
  return partes.slice(0, -1).join('.');
}

/**
 * Validar e formatar código
 * @param codigo - código a formatar
 * @param mascara - padrão
 * @returns código formatado ou null se inválido
 */
export function formatarCodigo(codigo: string, mascara: string): string | null {
  const codigoLimpo = codigo.trim();
  
  if (!validarCodigo(codigoLimpo, mascara)) {
    return null;
  }
  
  return codigoLimpo;
}

/**
 * Gerar máscara padrão recomendada
 * @returns máscara padrão: "9.9.99.999"
 */
export function getMascaraPadrao(): MascaraConfig {
  return {
    mascara: '9.9.99.999',
    descricao: 'Padrão recomendado: Classe.Subclasse.Grupo.Subconta'
  };
}

/**
 * Validar formato de máscara
 * @param mascara - máscara a validar
 * @returns true se é máscara válida
 */
export function validarMascara(mascara: string): boolean {
  // Deve ter apenas 9 (dígito) e . (separador)
  // Cada segmento pode ter um ou mais 9s
  if (!/^9+(\.9+)*$/.test(mascara)) {
    return false;
  }
  
  // Máximo 6 níveis
  const niveis = mascara.split('.').length;
  if (niveis > 6) {
    return false;
  }
  
  // Mínimo 1 nível
  if (niveis < 1) {
    return false;
  }
  
  return true;
}

/**
 * Gerar exemplo de código válido baseado na máscara
 * @param mascara - padrão
 * @returns exemplo (ex: para "9.9.99.999" retorna "1.2.03.005")
 */
export function gerarExemploCodigo(mascara: string): string {
  const partes = mascara.split('.');
  return partes
    .map((parte, idx) => {
      const num = idx + 1;
      return String(num).padStart(parte.length, '0');
    })
    .join('.');
}

/**
 * Obter total de dígitos esperados pela máscara
 * @param mascara - padrão (ex: "9.9.99.999")
 * @returns total de dígitos (ex: para "9.9.99.999" retorna 7)
 */
export function getTotalDigitos(mascara: string): number {
  const partes = mascara.split('.');
  return partes.reduce((total, parte) => total + parte.length, 0);
}

/**
 * Formatar código com mascara em tempo real
 * Remove caracteres inválidos e insere pontos automaticamente
 * @param input - input do usuário (ex: "12")
 * @param mascara - padrão (ex: "9.9.99.999")
 * @param apenasSegmentoRaiz - se true, aceita apenas o primeiro segmento da máscara
 * @returns código formatado (ex: "1.2._._") ou input se inválido
 */
export function formatarCodigoComMascara(input: string, mascara: string, apenasSegmentoRaiz: boolean = false): string {
  // Remove tudo que não é número
  const apenasNumeros = input.replace(/\D/g, '');
  
  const partesMascara = mascara.split('.');
  
  // Se for conta raiz, limita ao primeiro segmento apenas
  if (apenasSegmentoRaiz) {
    const tamanhoRaiz = partesMascara[0].length;
    const numerosLimitados = apenasNumeros.substring(0, tamanhoRaiz);
    
    // Preenche com _ se incompleto
    let resultado = numerosLimitados;
    while (resultado.length < tamanhoRaiz) {
      resultado += '_';
    }
    
    return resultado;
  }
  
  // Limita ao total de dígitos da máscara
  const totalDigitos = getTotalDigitos(mascara);
  const numerosLimitados = apenasNumeros.substring(0, totalDigitos);
  
  let resultado = '';
  let indiceNumeros = 0;
  
  // Monta o código com pontos baseado na máscara
  for (let i = 0; i < partesMascara.length; i++) {
    const tamanho = partesMascara[i].length;
    
    // Coleta dígitos para esta parte
    let parteCodigo = '';
    for (let j = 0; j < tamanho && indiceNumeros < numerosLimitados.length; j++) {
      parteCodigo += numerosLimitados[indiceNumeros];
      indiceNumeros++;
    }
    
    // Se esta parte tem algum dígito, adiciona ao resultado
    if (parteCodigo.length > 0) {
      if (resultado.length > 0) resultado += '.';
      
      // Preenche com _ se incompleto
      while (parteCodigo.length < tamanho) {
        parteCodigo += '_';
      }
      
      resultado += parteCodigo;
    } else {
      // Se não tem dígito nesta parte, para aqui
      break;
    }
  }
  
  return resultado;
}

/**
 * Verificar se código está completo (sem _)
 * @param codigo - código formatado (ex: "1.2.03.005")
 * @returns true se completo
 */
export function isCodigoCompleto(codigo: string): boolean {
  return !codigo.includes('_');
}

/**
 * Extrair apenas números do código formatado
 * @param codigo - código formatado (ex: "1.2.03._")
 * @returns apenas números (ex: "1203")
 */
export function extrairNumerosDoCodigo(codigo: string): string {
  return codigo.replace(/\D/g, '');
}
