/** Persistência da evolução: só contadores no localStorage (ADR-002). */

export const CHAVE_EVOLUCAO = 'poker-trainer:evolucao';

export const CATEGORIA_IDS = Object.freeze([
  'royal_flush',
  'straight_flush',
  'quadra',
  'full_house',
  'flush',
  'straight',
  'trinca',
  'dois_pares',
  'par',
  'carta_alta',
]);

function celulaZero() {
  return { acertos: 0, erros: 0, exposicoes: 0 };
}

function mapaCategoriasZero() {
  const mapa = {};
  for (const id of CATEGORIA_IDS) {
    mapa[id] = celulaZero();
  }
  return mapa;
}

export function evolucaoZerada() {
  return {
    mao_atual: mapaCategoriasZero(),
    upgrade: mapaCategoriasZero(),
    vencedor_pote: celulaZero(),
  };
}

function clonar(evolucao) {
  return JSON.parse(JSON.stringify(evolucao));
}

function inteiroNaoNegativo(valor) {
  if (!Number.isInteger(valor) || valor < 0) return 0;
  return valor;
}

function celulaDe(bruto) {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) {
    return celulaZero();
  }
  const acertos = inteiroNaoNegativo(bruto.acertos);
  const erros = inteiroNaoNegativo(bruto.erros);
  return { acertos, erros, exposicoes: acertos + erros };
}

function objetoPlano(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function preencherBucket(destino, origem) {
  if (!objetoPlano(origem)) return;
  for (const id of CATEGORIA_IDS) {
    if (origem[id] != null) {
      destino[id] = celulaDe(origem[id]);
    }
  }
}

function garantirSchema(evolucao) {
  const out = evolucaoZerada();
  if (!objetoPlano(evolucao)) return out;
  preencherBucket(out.mao_atual, evolucao.mao_atual);
  preencherBucket(out.upgrade, evolucao.upgrade);
  if (objetoPlano(evolucao.vencedor_pote)) {
    out.vencedor_pote = celulaDe(evolucao.vencedor_pote);
  }
  return out;
}

function somarCelula(celula, delta) {
  if (!delta) return;
  if (delta.acertos) celula.acertos += inteiroNaoNegativo(delta.acertos);
  if (delta.erros) celula.erros += inteiroNaoNegativo(delta.erros);
  celula.exposicoes = celula.acertos + celula.erros;
}

function aplicarSomas(evolucao, deltas) {
  const lista = Array.isArray(deltas) ? deltas : [deltas];
  for (const delta of lista) {
    if (!delta || typeof delta !== 'object') continue;
    if (delta.bucket === 'vencedor_pote') {
      somarCelula(evolucao.vencedor_pote, delta);
      continue;
    }
    if (delta.bucket === 'mao_atual' || delta.bucket === 'upgrade') {
      if (!CATEGORIA_IDS.includes(delta.categoria)) continue;
      somarCelula(evolucao[delta.bucket][delta.categoria], delta);
    }
  }
}

function apiPadrao() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function criarStorage({ api, indisponivel = false } = {}) {
  const armazenamento = indisponivel ? null : (api ?? apiPadrao());
  let memoria = evolucaoZerada();

  function lerDisco() {
    if (!armazenamento) return { tipo: 'indisponivel' };
    let bruto;
    try {
      bruto = armazenamento.getItem(CHAVE_EVOLUCAO);
    } catch {
      return { tipo: 'indisponivel' };
    }
    if (bruto == null || bruto === '') return { tipo: 'ausente' };
    let parsed;
    try {
      parsed = JSON.parse(bruto);
    } catch {
      return { tipo: 'corrupto' };
    }
    if (!objetoPlano(parsed)) return { tipo: 'corrupto' };
    const temMao = objetoPlano(parsed.mao_atual);
    const temUpgrade = objetoPlano(parsed.upgrade);
    const temVencedor = objetoPlano(parsed.vencedor_pote);
    if (!temMao && !temUpgrade && !temVencedor) return { tipo: 'corrupto' };
    const out = evolucaoZerada();
    if (temMao) preencherBucket(out.mao_atual, parsed.mao_atual);
    if (temUpgrade) preencherBucket(out.upgrade, parsed.upgrade);
    if (temVencedor) out.vencedor_pote = celulaDe(parsed.vencedor_pote);
    return { tipo: 'ok', evolucao: out };
  }

  function ler() {
    const disco = lerDisco();
    if (disco.tipo === 'ok') {
      memoria = disco.evolucao;
      return clonar(memoria);
    }
    if (disco.tipo === 'corrupto') {
      memoria = evolucaoZerada();
      return clonar(memoria);
    }
    return clonar(memoria);
  }

  function gravar(evolucao) {
    const blob = garantirSchema(evolucao);
    memoria = clonar(blob);
    if (!armazenamento) return false;
    try {
      armazenamento.setItem(CHAVE_EVOLUCAO, JSON.stringify(blob));
      return true;
    } catch {
      return false;
    }
  }

  function aplicarDeltas(deltas) {
    const atual = ler();
    aplicarSomas(atual, deltas);
    const normalizado = garantirSchema(atual);
    gravar(normalizado);
    return clonar(normalizado);
  }

  return { ler, gravar, aplicarDeltas };
}
