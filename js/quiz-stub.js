/** Cadência e correção provisórias da feature 001. Substituído nas features 003–006. */

export const COPY = Object.freeze({
  linhaProposito: 'Treine ler as mãos. Sem apostas.',
  ctaNovaMao: 'Nova mão',
  ctaProximaMao: 'Próxima mão',
  ctaContinuar: 'Continuar',
  semUpgrade: 'Não há upgrade possível.',
  enunciadoHero: 'Qual mão você tem agora?',
  enunciadoA: 'Qual mão o Adversário A completou?',
  enunciadoB: 'Qual mão o Adversário B completou?',
  enunciadoPote: 'Quem ganhou o pote?',
  acerto: 'Você acertou',
  erro: 'Não é essa. Tente de novo.',
});

export const APELIDOS = Object.freeze({
  voce: 'Você',
  adversarioA: 'Adversário A',
  adversarioB: 'Adversário B',
});

/** PassoQuizStub — ids estáveis da cadência. */
export const PASSOS = Object.freeze({
  flop_hero: 'flop_hero',
  flop_skip: 'flop_skip',
  turn_hero: 'turn_hero',
  turn_skip: 'turn_skip',
  river_hero: 'river_hero',
  river_a: 'river_a',
  river_b: 'river_b',
  river_vencedor: 'river_vencedor',
});

/** Conjunto RN-014 desta feature (6 opções; correta = par). */
export const CATEGORIAS_STUB = Object.freeze([
  Object.freeze({ id: 'par', rotulo: 'Par', correta: true }),
  Object.freeze({ id: 'carta_alta', rotulo: 'Carta alta', correta: false }),
  Object.freeze({ id: 'dois_pares', rotulo: 'Dois pares', correta: false }),
  Object.freeze({ id: 'trinca', rotulo: 'Trinca', correta: false }),
  Object.freeze({ id: 'flush', rotulo: 'Flush', correta: false }),
  Object.freeze({ id: 'straight', rotulo: 'Straight', correta: false }),
]);

/** Textos RN-030 usados no stub do pote (6 opções). */
export const VENCEDORES_STUB = Object.freeze([
  Object.freeze({ id: 'voce', rotulo: 'Você' }),
  Object.freeze({ id: 'adversarioA', rotulo: 'Adversário A' }),
  Object.freeze({ id: 'adversarioB', rotulo: 'Adversário B' }),
  Object.freeze({ id: 'voce_a', rotulo: 'Você e Adversário A' }),
  Object.freeze({ id: 'voce_b', rotulo: 'Você e Adversário B' }),
  Object.freeze({ id: 'a_b', rotulo: 'Adversário A e Adversário B' }),
]);

export const CATEGORIA_CORRETA_ID = 'par';
export const CATEGORIA_CORRETA_ROTULO = 'Par';

export function idVencedorCorreto(indiceMaoSessao) {
  return indiceMaoSessao >= 2 ? 'voce_a' : 'voce';
}

export function rotuloVencedorCorreto(indiceMaoSessao) {
  return indiceMaoSessao >= 2 ? 'Você e Adversário A' : 'Você';
}

/** RN-G008: permuta visual com Math.random (não é o shuffle do baralho). */
export function shuffleOpcoes(opcoes) {
  const arr = opcoes.map((item) => ({ ...item }));
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function baseOpcao(item, tipo, correta) {
  return {
    id: item.id,
    rotulo: item.rotulo,
    tipo,
    correta,
    estadoVisual: 'padrao',
    desabilitada: false,
  };
}

export function criarOpcoesCategoria() {
  return shuffleOpcoes(
    CATEGORIAS_STUB.map((item) => baseOpcao(item, 'categoria', item.correta)),
  );
}

export function criarOpcoesVencedor(indiceMaoSessao) {
  const corretaId = idVencedorCorreto(indiceMaoSessao);
  return shuffleOpcoes(
    VENCEDORES_STUB.map((item) => baseOpcao(item, 'vencedor', item.id === corretaId)),
  );
}

export function enunciadoDoPasso(passo) {
  switch (passo) {
    case PASSOS.flop_hero:
    case PASSOS.turn_hero:
    case PASSOS.river_hero:
      return COPY.enunciadoHero;
    case PASSOS.river_a:
      return COPY.enunciadoA;
    case PASSOS.river_b:
      return COPY.enunciadoB;
    case PASSOS.river_vencedor:
      return COPY.enunciadoPote;
    default:
      return null;
  }
}
