import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { cartasDeJogo, criarBaralhoPadrao } from '../../js/baralho.js';
import { aplicar, criarSessao, EVENTOS } from '../../js/mesa.js';
import {
  COPY,
  PASSOS,
  apresentarPergunta,
  decidirAposShowdown,
  decidirPosMaoAtual,
  prepararShowdown,
  shuffleOpcoes,
} from '../../js/quiz.js';
import { CHAVE_EVOLUCAO, criarStorage } from '../../js/storage.js';
import { CATEGORIAS, conjuntoOpcoesUpgrade } from '../../js/motor.js';

const raiz = dirname(fileURLToPath(import.meta.url));
const fonteQuiz = readFileSync(join(raiz, '../../js/quiz.js'), 'utf8');

const ROTULOS_RN014 = new Set(CATEGORIAS.map((item) => item.rotulo));

function carta(rank, naipe) {
  return { rank, naipe };
}

function payloadDeOnze(onze) {
  const usadas = new Set(onze.map((item) => `${item.rank}-${item.naipe}`));
  const resto = criarBaralhoPadrao().filter((item) => !usadas.has(`${item.rank}-${item.naipe}`));
  const permutacao = [...onze, ...resto];
  return { permutacao, cartasJogo: cartasDeJogo(permutacao) };
}

function payloadParFlop() {
  return payloadDeOnze([
    carta('K', 'espadas'),
    carta('K', 'copas'),
    carta('Q', 'espadas'),
    carta('Q', 'copas'),
    carta('2', 'espadas'),
    carta('9', 'copas'),
    carta('2', 'copas'),
    carta('A', 'ouros'),
    carta('7', 'paus'),
    carta('3', 'ouros'),
    carta('4', 'paus'),
  ]);
}

function payloadParFlopDoisParesTurn() {
  return payloadDeOnze([
    carta('K', 'espadas'),
    carta('K', 'copas'),
    carta('Q', 'espadas'),
    carta('Q', 'copas'),
    carta('A', 'espadas'),
    carta('3', 'paus'),
    carta('A', 'copas'),
    carta('K', 'ouros'),
    carta('7', 'espadas'),
    carta('7', 'copas'),
    carta('4', 'paus'),
  ]);
}

function memoria() {
  const map = new Map();
  return {
    map,
    api: {
      getItem: (chave) => (map.has(chave) ? map.get(chave) : null),
      setItem: (chave, valor) => {
        map.set(chave, String(valor));
      },
      removeItem: (chave) => {
        map.delete(chave);
      },
    },
  };
}

function sessaoNova(api) {
  return criarSessao({ storage: criarStorage({ api: api ?? memoria().api }) });
}

function ateFlopHero(sessao, payload = payloadParFlop()) {
  aplicar(sessao, EVENTOS.INICIAR_MAO, payload);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
}

function acertarHero(sessao) {
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function acertarUpgradeExibido(sessao) {
  for (const item of sessao.hud.opcoes.filter((opcao) => opcao.verdadeira && opcao.ativavel)) {
    aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: item.id });
  }
  aplicar(sessao, EVENTOS.CONFIRMAR);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function concluirPosMaoAtual(sessao) {
  if (sessao.hud.estado === 'ociosa') return;
  if (sessao.hud.estado === 'sem_upgrade') {
    aplicar(sessao, EVENTOS.CONTINUAR);
    return;
  }
  if (sessao.mao?.passo === PASSOS.flop_upgrade || sessao.mao?.passo === PASSOS.turn_upgrade) {
    acertarUpgradeExibido(sessao);
  }
}

function ateTurnHero(sessao, payload = payloadParFlop()) {
  ateFlopHero(sessao, payload);
  acertarHero(sessao);
  concluirPosMaoAtual(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
}

function payloadRoyalFlop() {
  return payloadDeOnze([
    carta('2', 'copas'),
    carta('3', 'copas'),
    carta('4', 'copas'),
    carta('5', 'copas'),
    carta('A', 'espadas'),
    carta('K', 'espadas'),
    carta('Q', 'espadas'),
    carta('J', 'espadas'),
    carta('10', 'espadas'),
    carta('2', 'ouros'),
    carta('3', 'ouros'),
  ]);
}

function payloadTurnDoisUpgrades() {
  return payloadDeOnze([
    carta('A', 'copas'),
    carta('K', 'copas'),
    carta('Q', 'copas'),
    carta('J', 'copas'),
    carta('8', 'espadas'),
    carta('8', 'copas'),
    carta('8', 'ouros'),
    carta('2', 'paus'),
    carta('9', 'espadas'),
    carta('3', 'copas'),
    carta('4', 'ouros'),
  ]);
}

function sessaoUpgradeConstruido(conjunto, rng = Math.random) {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarHero(sessao);
  sessao.mao.upgradesStreet = {
    ok: true,
    lista: [...conjunto.verdadeiros],
    conjunto,
    categoriaAtual: 'par',
    street: 'flop',
  };
  apresentarPergunta(sessao, PASSOS.flop_upgrade, rng);
  return sessao;
}

function opcao(sessao, id) {
  return sessao.hud.opcoes.find((item) => item.id === id);
}

function distratora(sessao) {
  return sessao.hud.opcoes.find((item) => item.verdadeira === false);
}

function acertarUnica(sessao) {
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function payloadHeroiParAFlush() {
  return payloadDeOnze([
    carta('4', 'copas'),
    carta('8', 'copas'),
    carta('3', 'ouros'),
    carta('6', 'espadas'),
    carta('2', 'espadas'),
    carta('2', 'paus'),
    carta('A', 'copas'),
    carta('K', 'copas'),
    carta('Q', 'copas'),
    carta('7', 'ouros'),
    carta('9', 'paus'),
  ]);
}

function payloadEmpateVoceA() {
  return payloadDeOnze([
    carta('A', 'ouros'),
    carta('9', 'paus'),
    carta('4', 'copas'),
    carta('5', 'espadas'),
    carta('A', 'copas'),
    carta('9', 'espadas'),
    carta('K', 'espadas'),
    carta('K', 'ouros'),
    carta('7', 'copas'),
    carta('3', 'paus'),
    carta('2', 'ouros'),
  ]);
}

function payloadRoyalBoard() {
  return payloadDeOnze([
    carta('4', 'copas'),
    carta('5', 'ouros'),
    carta('6', 'copas'),
    carta('7', 'ouros'),
    carta('2', 'copas'),
    carta('3', 'ouros'),
    carta('A', 'espadas'),
    carta('K', 'espadas'),
    carta('Q', 'espadas'),
    carta('J', 'espadas'),
    carta('10', 'espadas'),
  ]);
}

function ateRiverHero(sessao, payload = payloadParFlop()) {
  ateTurnHero(sessao, payload);
  acertarHero(sessao);
  concluirPosMaoAtual(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
}

function ateRiverVencedor(sessao, payload = payloadHeroiParAFlush()) {
  ateRiverHero(sessao, payload);
  acertarUnica(sessao);
  acertarUnica(sessao);
  acertarUnica(sessao);
}

test('§5.1 flop pousado: enunciado canônico, 6 rótulos RN-014, 0 Confirmar', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  assert.equal(sessao.hud.enunciado, 'Qual mão você tem agora?');
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.equal(sessao.hud.cta, null);
  const ids = new Set(sessao.hud.opcoes.map((item) => item.id));
  const rotulos = new Set(sessao.hud.opcoes.map((item) => item.rotulo));
  assert.equal(ids.size, 6);
  assert.equal(rotulos.size, 6);
  assert.ok([...rotulos].every((rotulo) => ROTULOS_RN014.has(rotulo)));
  assert.ok(sessao.mao.upgradesStreet);
  assert.ok(sessao.mao.upgradesStreet.ok === true || sessao.mao.upgradesStreet.ok === false);
  assert.equal(['pergunta', 'skip', 'falha'].includes(decidirPosMaoAtual(sessao)), true);
  assert.equal(fonteQuiz.includes('CONJUNTO_UPGRADE_STUB'), false);
});

test('§5.2 fixture de par no flop: corretaUnica par; 1ª acerto → mao_atual.par', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  assert.equal(sessao.mao.corretaUnica, 'par');
  const verdadeiras = sessao.hud.opcoes.filter((item) => item.verdadeira);
  assert.equal(verdadeiras.length, 1);
  assert.equal(verdadeiras[0].id, 'par');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.par.erros, 0);
  assert.equal(sessao.evolucao.mao_atual.par.exposicoes, 1);
});

test('§5.4 acerto flop + beat → flop_upgrade, não turn', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarHero(sessao);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.equal(sessao.hud.enunciado, 'Quais mãos você ainda não tem, mas ainda pode formar?');
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaConfirmar);
  assert.notEqual(sessao.mao.street, 'turn');
  assert.notEqual(sessao.mao.passo, PASSOS.turn_hero);
  const flush = opcao(sessao, 'flush');
  if (flush) {
    const verdadeiro = sessao.mao.upgradesStreet.lista.includes('flush');
    assert.equal(flush.verdadeira, verdadeiro);
  }
});

test('unica: 0 Confirmar; clique distratora submete; clique da certa submete', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  assert.notEqual(sessao.hud.cta?.nome, COPY.ctaConfirmar);
  assert.equal(sessao.hud.cta, null);
  const morta = distratora(sessao);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: morta.id });
  assert.equal(sessao.hud.feedback, 'erro');
  assert.equal(sessao.hud.feedbackTexto, COPY.erro);
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.hud.feedbackTexto, COPY.acerto);
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
});

test('§5.3 / RN-019: erro na categoria correta; morta no lugar; 2º clique não vira acerto', () => {
  const { api } = memoria();
  const sessao = sessaoNova(api);
  ateFlopHero(sessao);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  const chute = distratora(sessao);
  const indice = ordem.indexOf(chute.id);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.hud.feedbackTexto, 'Não é essa. Tente de novo.');
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
  const morta = sessao.hud.opcoes[indice];
  assert.equal(morta.id, chute.id);
  assert.equal(morta.estadoVisual, 'eliminada');
  assert.equal(morta.marca, 'corte');
  assert.equal(morta.ativavel, false);
  const certa = opcao(sessao, 'par');
  assert.notEqual(certa.estadoVisual, 'acertada');
  assert.notEqual(certa.marca, 'acerto');
  assert.equal(sessao.evolucao.mao_atual.par.erros, 1);
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 0);
  assert.deepEqual(sessao.evolucao.mao_atual[chute.id], {
    acertos: 0,
    erros: 0,
    exposicoes: 0,
  });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.evolucao.mao_atual.par.erros, 1);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'ausente' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 0);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 0);
  assert.equal(sessao.evolucao.mao_atual.par.erros, 1);
  assert.equal(sessao.hud.feedback, 'acerto');
});

test('multipla: toggle não avalia; só CONFIRMAR avalia', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarHero(sessao);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  const alvo = sessao.hud.opcoes[0];
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: alvo.id });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.hud.feedback, null);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
  assert.equal(opcao(sessao, alvo.id).estadoVisual, 'selecionada');
});

test('1ª Confirmar Flush+Par: acerto flush, erro par, pergunta não fecha', () => {
  const conjunto = {
    ids: ['flush', 'par', 'trinca', 'straight', 'dois_pares', 'carta_alta'],
    verdadeiros: ['flush'],
  };
  const sessao = sessaoUpgradeConstruido(conjunto);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(sessao.evolucao.upgrade.flush.acertos, 1);
  assert.equal(sessao.evolucao.upgrade.par.erros, 1);
  assert.equal(sessao.evolucao.upgrade.par.acertos, 0);
  assert.equal(opcao(sessao, 'par').estadoVisual, 'eliminada');
  assert.equal(opcao(sessao, 'par').marca, 'corte');
  assert.equal(opcao(sessao, 'flush').estadoVisual, 'acertada');
  assert.equal(opcao(sessao, 'flush').ativavel, false);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.notEqual(sessao.mao.faseTentativa, 'aguardando_beat');
});

test('1ª Confirmar vazio: upgrade.flush +1 erro; Flush segue ativável', () => {
  const conjunto = {
    ids: ['flush', 'par', 'trinca', 'straight', 'dois_pares', 'carta_alta'],
    verdadeiros: ['flush'],
  };
  const sessao = sessaoUpgradeConstruido(conjunto);
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(sessao.evolucao.upgrade.flush.erros, 1);
  assert.equal(sessao.evolucao.upgrade.flush.acertos, 0);
  assert.equal(sessao.evolucao.upgrade.par.erros, 0);
  assert.equal(opcao(sessao, 'flush').ativavel, true);
  assert.equal(sessao.hud.feedbackTexto, COPY.erro);
});

test('2ª Confirmar não muda contadores; distratora nova morre', () => {
  const conjunto = {
    ids: ['flush', 'par', 'trinca', 'straight', 'dois_pares', 'carta_alta'],
    verdadeiros: ['flush'],
  };
  const sessao = sessaoUpgradeConstruido(conjunto);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'trinca' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
  assert.equal(opcao(sessao, 'trinca').estadoVisual, 'eliminada');
});

test('conjunto só Flush na 1ª Confirmar: acerto + beat', () => {
  const conjunto = {
    ids: ['flush', 'par', 'trinca', 'straight', 'dois_pares', 'carta_alta'],
    verdadeiros: ['flush'],
  };
  const sessao = sessaoUpgradeConstruido(conjunto);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
  assert.equal(sessao.evolucao.upgrade.flush.acertos, 1);
});

test('§5.5–5.6 turn pousado: nova pergunta; 1ª tentativa nova; beat → turn_upgrade', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao, payloadParFlopDoisParesTurn());
  assert.equal(sessao.hud.enunciado, 'Qual mão você tem agora?');
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.equal(sessao.mao.corretaUnica, 'dois_pares');
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.dois_pares.exposicoes, 0);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'dois_pares' });
  assert.equal(sessao.evolucao.mao_atual.dois_pares.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.dois_pares.exposicoes, 1);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  assert.equal(sessao.mao.passo, PASSOS.turn_upgrade);
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.hud.enunciado, COPY.enunciadoUpgrades);
  assert.notEqual(sessao.mao.street, 'river');
});

test('SC-012: flop e turn da mesma mão são duas exposições mesmo com o mesmo id', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao, payloadParFlop());
  assert.equal(sessao.mao.corretaUnica, 'par');
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 1);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 2);
  assert.equal(sessao.evolucao.mao_atual.par.exposicoes, 2);
});

test('turn_skip / Continuar não toca upgrade', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao, payloadRoyalFlop());
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  acertarHero(sessao);
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  assert.equal(sessao.mao.passo, PASSOS.turn_skip);
  aplicar(sessao, EVENTOS.CONTINUAR);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
});

test('§5.8 G008: 10 apresentar não fixam a correta; retry não permuta; conjunto estável', () => {
  const indices = [];
  const conjuntos = [];
  for (let i = 0; i < 10; i += 1) {
    const sessao = sessaoNova();
    const payload = i % 2 === 0 ? payloadParFlop() : payloadParFlopDoisParesTurn();
    if (i < 5) ateFlopHero(sessao, payload);
    else ateTurnHero(sessao, payload);
    indices.push(sessao.hud.opcoes.findIndex((item) => item.id === sessao.mao.corretaUnica));
    conjuntos.push([...sessao.hud.opcoes.map((item) => item.id)].sort().join('|'));
  }
  assert.ok(new Set(indices).size > 1);
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: distratora(sessao).id });
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
  const repetida = sessaoNova();
  ateFlopHero(repetida, payloadParFlop());
  const idsA = new Set(sessao.hud.opcoes.map((item) => item.id));
  const idsB = new Set(repetida.hud.opcoes.map((item) => item.id));
  assert.deepEqual([...idsA].sort(), [...idsB].sort());
  const rng = () => 0;
  const a = shuffleOpcoes([{ id: 'a' }, { id: 'b' }, { id: 'c' }], rng);
  const b = shuffleOpcoes([{ id: 'a' }, { id: 'b' }, { id: 'c' }], rng);
  assert.deepEqual(
    a.map((item) => item.id),
    b.map((item) => item.id),
  );
  void conjuntos;
});

test('§5.9 / SC-008: 0 kickers, 0 sinônimos, 0 chaveDesempate no HUD', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  const textos = [
    sessao.hud.enunciado,
    ...sessao.hud.opcoes.map((item) => item.rotulo),
    JSON.stringify(sessao.hud),
  ].join(' | ');
  assert.equal(/par de (reis|ases)/i.test(textos), false);
  assert.equal(/Sequência/.test(textos), false);
  assert.equal(/chaveDesempate/.test(textos), false);
  assert.ok(sessao.hud.opcoes.every((item) => ROTULOS_RN014.has(item.rotulo)));
  ateTurnHero(sessaoNova());
  const turn = sessaoNova();
  ateTurnHero(turn);
  const textosTurn = [turn.hud.enunciado, ...turn.hud.opcoes.map((item) => item.rotulo)].join(' | ');
  assert.equal(/par de (reis|ases)/i.test(textosTurn), false);
  assert.equal(/Sequência/.test(textosTurn), false);
});

test('vencedor 1ª tentativa alimenta só vencedor_pote', () => {
  const sessao = sessaoNova();
  ateRiverVencedor(sessao);
  const maoAntes = JSON.stringify(sessao.evolucao.mao_atual);
  const upgradeAntes = JSON.stringify(sessao.evolucao.upgrade);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  assert.equal(sessao.evolucao.vencedor_pote.acertos, 1);
  assert.equal(sessao.evolucao.vencedor_pote.erros, 0);
  assert.equal(sessao.evolucao.vencedor_pote.exposicoes, 1);
  assert.equal(JSON.stringify(sessao.evolucao.mao_atual), maoAntes);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), upgradeAntes);
});

test('river_hero usa Melhor5 real, não stub Flush', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao, payloadHeroiParAFlush());
  assert.equal(sessao.mao.passo, PASSOS.river_hero);
  assert.equal(sessao.mao.corretaUnica, 'par');
  assert.equal(sessao.hud.enunciado, 'Qual mão você tem agora?');
  assert.equal(sessao.hud.cta, null);
  assert.equal(sessao.hud.opcoes.length, 6);
  const rotulos = new Set(sessao.hud.opcoes.map((item) => item.rotulo));
  assert.equal(rotulos.size, 6);
  assert.ok([...rotulos].every((rotulo) => ROTULOS_RN014.has(rotulo)));
  acertarUnica(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_a);
  assert.notEqual(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.notEqual(sessao.mao.passo, PASSOS.turn_upgrade);
});

test('storage indisponível: HUD e mão seguem; 0 throw; blob sem PII', () => {
  const sessao = criarSessao({ storage: criarStorage({ indisponivel: true }) });
  assert.doesNotThrow(() => {
    ateFlopHero(sessao);
    aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: distratora(sessao).id });
    aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
    aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  });
  assert.equal(sessao.hud.feedbackTexto ?? COPY.acerto, COPY.acerto);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  const { map, api } = memoria();
  const ok = sessaoNova(api);
  ateFlopHero(ok);
  aplicar(ok, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  const blob = JSON.parse(map.get(CHAVE_EVOLUCAO));
  const json = JSON.stringify(blob);
  assert.equal('nome' in blob, false);
  assert.equal('email' in blob, false);
  assert.equal('cpf' in blob, false);
  assert.equal('versao' in blob, false);
  assert.equal('chaveDesempate' in blob, false);
  assert.match(json, /mao_atual/);
  assert.equal(/@/.test(json), false);
  assert.equal(/chaveDesempate/.test(json), false);
});

test('quiz.js não importa baralho nem usa setTimeout na FSM', () => {
  assert.equal(fonteQuiz.includes('baralho.js'), false);
  assert.equal(fonteQuiz.includes('setTimeout'), false);
  assert.equal(fonteQuiz.includes('alert('), false);
  assert.equal(fonteQuiz.includes('embaralhar'), false);
  assert.ok(fonteQuiz.includes("from './motor.js'"));
});

test('river_hero não usa stub Flush; certa é a Melhor5 das 7', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao, payloadHeroiParAFlush());
  const certa = sessao.hud.opcoes.find((item) => item.verdadeira);
  assert.equal(certa.id, 'par');
  assert.notEqual(certa.id, 'flush');
});

test('CA-017 royal no flop → flop_skip, 0 upgrade, Continuar abre o turn', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao, payloadRoyalFlop());
  const jogoAntes = sessao.mao.cartasJogo.map((carta) => `${carta.rank}-${carta.naipe}`).join('|');
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  acertarHero(sessao);
  assert.equal(sessao.mao.passo, PASSOS.flop_skip);
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  assert.equal(sessao.hud.opcoes.length, 0);
  aplicar(sessao, EVENTOS.CONTINUAR);
  assert.equal(sessao.mao.street, 'turn');
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  assert.equal(sessao.mao.cartasJogo.map((carta) => `${carta.rank}-${carta.naipe}`).join('|'), jogoAntes);
});

test('CA-015 turn com exatamente 2 upgrades: 2 verdadeiras + 4 distratoras', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao, payloadTurnDoisUpgrades());
  acertarHero(sessao);
  assert.equal(sessao.mao.passo, PASSOS.turn_upgrade);
  assert.equal(sessao.hud.opcoes.length, 6);
  const verdadeiras = sessao.hud.opcoes.filter((item) => item.verdadeira).map((item) => item.id);
  assert.equal(verdadeiras.length, 2);
  assert.ok(verdadeiras.includes('quadra'));
  assert.ok(verdadeiras.includes('full_house'));
  acertarUpgradeExibido(sessao);
  assert.equal(sessao.mao.street, 'river');
  assert.notEqual(sessao.mao.passo, PASSOS.turn_upgrade);
});

test('0 passo *_upgrade no river', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_hero);
  assert.notEqual(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.notEqual(sessao.mao.passo, PASSOS.turn_upgrade);
});

test('enumerar !ok no pouso → ociosa + copy de enumeração; 0 sem_upgrade', () => {
  const { api } = memoria();
  const sessao = sessaoNova(api);
  ateFlopHero(sessao);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  const evolucao = JSON.stringify(sessao.evolucao);
  aplicar(sessao, EVENTOS.FALHA_ENUMERACAO);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
  assert.equal(sessao.hud.linhaErro, COPY.linhaErroEnumeracao);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.notEqual(sessao.hud.estado, 'sem_upgrade');
  const deNovo = sessaoNova(api);
  assert.equal(JSON.stringify(deNovo.evolucao), evolucao);
});

test('G008: 10 perguntas novas de upgrade não fixam a ordem; retry não permuta', () => {
  const conjunto = conjuntoOpcoesUpgrade({ upgrades: ['flush', 'straight'] });
  const ordens = [];
  for (let i = 0; i < 10; i += 1) {
    const sessao = sessaoUpgradeConstruido(conjunto);
    ordens.push(sessao.hud.opcoes.map((item) => item.id).join('|'));
  }
  assert.ok(new Set(ordens).size > 1);
  const sessao = sessaoUpgradeConstruido(conjunto);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: sessao.hud.opcoes.find((item) => !item.verdadeira).id });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
});

test('omitted-from-6: 1ª Confirmar não toca par/dois_pares/trinca', () => {
  const conjunto = conjuntoOpcoesUpgrade({
    upgrades: [
      'royal_flush',
      'straight_flush',
      'quadra',
      'full_house',
      'flush',
      'straight',
      'trinca',
      'dois_pares',
      'par',
    ],
  });
  const sessao = sessaoUpgradeConstruido(conjunto);
  for (const item of sessao.hud.opcoes.filter((opcao) => opcao.verdadeira)) {
    aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: item.id });
  }
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.deepEqual(sessao.evolucao.upgrade.par, { acertos: 0, erros: 0, exposicoes: 0 });
  assert.deepEqual(sessao.evolucao.upgrade.dois_pares, { acertos: 0, erros: 0, exposicoes: 0 });
  assert.deepEqual(sessao.evolucao.upgrade.trinca, { acertos: 0, erros: 0, exposicoes: 0 });
  assert.equal(sessao.hud.opcoes.some((item) => item.id === 'par'), false);
});

test('5.4: 0 marcar todas; 0 draws/kickers/Sequência/chaveDesempate no HUD', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarHero(sessao);
  const textos = [
    sessao.hud.enunciado,
    sessao.hud.feedbackTexto,
    ...sessao.hud.opcoes.map((item) => `${item.rotulo}|${item.id}`),
    JSON.stringify(sessao.hud),
  ].join(' | ');
  assert.equal(/marcar todas/i.test(textos), false);
  assert.equal(/draw|gutshot|outs|oesd|flush draw|straight draw/i.test(textos), false);
  assert.equal(/par de (reis|ases)/i.test(textos), false);
  assert.equal(/Sequência/.test(textos), false);
  assert.equal(/chaveDesempate/.test(textos), false);
  assert.equal(fonteQuiz.includes('marcar todas'), false);
  assert.equal(sessao.hud.opcoes[0].ativavel, true);
});

test('flop e turn não-skip: duas 1ªs Confirmar independentes em upgrade', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao, payloadTurnDoisUpgrades());
  acertarHero(sessao);
  acertarUpgradeExibido(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  acertarHero(sessao);
  const depoisFlop = JSON.stringify(sessao.evolucao.upgrade);
  acertarUpgradeExibido(sessao);
  assert.notEqual(JSON.stringify(sessao.evolucao.upgrade), depoisFlop);
});

test('CA-019 river_a Flush real; river_hero não é Flush-cego; retry', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao, payloadHeroiParAFlush());
  assert.equal(sessao.mao.corretaUnica, 'par');
  assert.equal(sessao.hud.enunciado, 'Qual mão você tem agora?');
  acertarUnica(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_a);
  assert.equal(sessao.hud.enunciado, 'Qual mão o Adversário A completou?');
  assert.equal(sessao.mao.corretaUnica, 'flush');
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.equal(sessao.hud.cta, null);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  const chute = distratora(sessao);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.hud.feedbackTexto, 'Não é essa. Tente de novo.');
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
  assert.equal(opcao(sessao, chute.id).estadoVisual, 'eliminada');
  assert.notEqual(sessao.mao.passo, PASSOS.river_b);
  assert.notEqual(sessao.mao.passo, PASSOS.river_vencedor);
});

test('SC-014 uma pergunta por vez; B e pote invisíveis até acertar a anterior', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao, payloadHeroiParAFlush());
  assert.equal(sessao.mao.passo, PASSOS.river_hero);
  acertarUnica(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_a);
  assert.equal(sessao.hud.enunciado, 'Qual mão o Adversário A completou?');
  assert.equal(JSON.stringify(sessao.hud).includes('chaveDesempate'), false);
  acertarUnica(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_b);
  assert.equal(sessao.hud.enunciado, 'Qual mão o Adversário B completou?');
  acertarUnica(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_vencedor);
  assert.equal(sessao.hud.enunciado, 'Quem ganhou o pote?');
});

test('CA-020 empate herói vs A: certa Você e Adversário A; 6 textos; exclui tres', () => {
  const sessao = sessaoNova();
  ateRiverVencedor(sessao, payloadEmpateVoceA());
  assert.equal(sessao.mao.passo, PASSOS.river_vencedor);
  assert.equal(sessao.hud.enunciado, 'Quem ganhou o pote?');
  assert.equal(sessao.mao.corretaUnica, 'voce_a');
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.ok(sessao.hud.opcoes.every((item) => item.tipo === 'vencedor'));
  const ids = sessao.hud.opcoes.map((item) => item.id);
  assert.ok(ids.includes('voce_a'));
  assert.equal(ids.includes('tres'), false);
  assert.ok(sessao.hud.opcoes.every((item) => !ROTULOS_RN014.has(item.rotulo)));
  const textos = [sessao.hud.enunciado, ...sessao.hud.opcoes.map((item) => item.rotulo)].join(' | ');
  assert.equal(/par de (reis|ases)/i.test(textos), false);
  assert.equal(/kicker/i.test(textos), false);
});

test('G008: 10 perguntas novas de pote não fixam o índice; retry não permuta', () => {
  const indices = [];
  for (let i = 0; i < 10; i += 1) {
    const sessao = sessaoNova();
    ateRiverVencedor(sessao, payloadEmpateVoceA());
    indices.push(sessao.hud.opcoes.findIndex((item) => item.verdadeira));
  }
  assert.ok(new Set(indices).size > 1);
  const sessao = sessaoNova();
  ateRiverVencedor(sessao, payloadEmpateVoceA());
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: distratora(sessao).id });
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
});

test('1ª tentativa de A (erro Flush) incrementa mao_atual.flush, não par', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao, payloadHeroiParAFlush());
  acertarUnica(sessao);
  assert.equal(sessao.mao.corretaUnica, 'flush');
  const parAntes = { ...sessao.evolucao.mao_atual.par };
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: distratora(sessao).id });
  assert.equal(sessao.evolucao.mao_atual.flush.erros, 1);
  assert.equal(sessao.evolucao.mao_atual.flush.acertos, 0);
  assert.equal(sessao.evolucao.mao_atual.flush.exposicoes, 1);
  assert.equal(sessao.evolucao.mao_atual.par.acertos, parAntes.acertos);
  assert.equal(sessao.evolucao.mao_atual.par.erros, parAntes.erros);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.evolucao.mao_atual.flush.erros, 1);
  assert.equal(sessao.evolucao.mao_atual.flush.acertos, 0);
});

test('três 1ªs de categoria independentes mesmo com rótulo compartilhado', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao, payloadRoyalBoard());
  assert.equal(sessao.mao.corretaUnica, 'royal_flush');
  acertarUnica(sessao);
  assert.equal(sessao.evolucao.mao_atual.royal_flush.acertos, 1);
  assert.equal(sessao.mao.corretaUnica, 'royal_flush');
  acertarUnica(sessao);
  assert.equal(sessao.evolucao.mao_atual.royal_flush.acertos, 2);
  assert.equal(sessao.mao.corretaUnica, 'royal_flush');
  acertarUnica(sessao);
  assert.equal(sessao.evolucao.mao_atual.royal_flush.acertos, 3);
  assert.equal(sessao.evolucao.mao_atual.royal_flush.exposicoes, 3);
});

test('prepararShowdown inválido → ok false; decidir falha; 0 pergunta', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao, payloadHeroiParAFlush());
  acertarHero(sessao);
  concluirPosMaoAtual(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  sessao.mao.cartasJogo[10] = { ...sessao.mao.cartasJogo[0] };
  prepararShowdown(sessao);
  assert.equal(sessao.mao.showdown.ok, false);
  assert.equal(decidirAposShowdown(sessao), 'falha');
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.notEqual(sessao.hud.estado, 'perguntando');
});

test('royal no board: três Royal flush; pote Os três empatam; conjunto exclui a_b', () => {
  const sessao = sessaoNova();
  ateRiverVencedor(sessao, payloadRoyalBoard());
  assert.equal(sessao.mao.showdown.vencedorId, 'tres');
  assert.equal(sessao.mao.corretaUnica, 'tres');
  const ids = sessao.hud.opcoes.map((item) => item.id);
  assert.ok(ids.includes('tres'));
  assert.equal(ids.includes('a_b'), false);
  const certa = sessao.hud.opcoes.find((item) => item.verdadeira);
  assert.equal(certa.rotulo, 'Os três empatam');
  const textos = [
    sessao.hud.enunciado,
    ...sessao.hud.opcoes.map((item) => item.rotulo),
    JSON.stringify(sessao.hud),
  ].join(' | ');
  assert.equal(/par de (reis|ases)/i.test(textos), false);
  assert.equal(/Sequência/.test(textos), false);
  assert.equal(/chaveDesempate/.test(textos), false);
  assert.equal(/espadas|copas|ouros|paus/.test(textos), false);
});

test('0 kickers / 0 Sequência no HUD das quatro perguntas do river', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao, payloadHeroiParAFlush());
  for (const passo of [PASSOS.river_hero, PASSOS.river_a, PASSOS.river_b, PASSOS.river_vencedor]) {
    assert.equal(sessao.mao.passo, passo);
    const textos = [sessao.hud.enunciado, ...sessao.hud.opcoes.map((item) => item.rotulo)].join(' | ');
    assert.equal(/par de (reis|ases)/i.test(textos), false);
    assert.equal(/Sequência/.test(textos), false);
    assert.equal(/chaveDesempate/.test(JSON.stringify(sessao.hud)), false);
    if (passo !== PASSOS.river_vencedor) acertarUnica(sessao);
  }
});

test('fonte do quiz: 0 stub Flush/Par/indiceMaoSessao como verdade; 0 river_upgrade', () => {
  assert.equal(fonteQuiz.includes('CATEGORIAS_STUB'), false);
  assert.equal(fonteQuiz.includes('CATEGORIA_CORRETA_ID'), false);
  assert.equal(fonteQuiz.includes('idVencedorCorreto'), false);
  assert.equal(fonteQuiz.includes('indiceMaoSessao'), false);
  assert.equal(fonteQuiz.includes('river_upgrade'), false);
  assert.ok(fonteQuiz.includes('prepararShowdown'));
  assert.ok(fonteQuiz.includes('quemGanhou'));
});
