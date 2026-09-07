import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as audio from '../../js/audio.js';

test('não exporta mute, unmute, volume ou setVolume', () => {
  assert.equal(audio.mute, undefined);
  assert.equal(audio.unmute, undefined);
  assert.equal(audio.volume, undefined);
  assert.equal(audio.setVolume, undefined);
  assert.equal(typeof audio.unlock, 'function');
  assert.equal(typeof audio.play, 'function');
});

test('unlock e play nunca lançam sem AudioContext', async () => {
  await assert.doesNotReject(() => audio.unlock());
  assert.doesNotThrow(() => audio.play('shuffle'));
  assert.doesNotThrow(() => audio.play('deal'));
  assert.doesNotThrow(() => audio.play('flop'));
  assert.doesNotThrow(() => audio.play('showdown'));
  assert.doesNotThrow(() => audio.play('acerto'));
  assert.doesNotThrow(() => audio.play('erro'));
  assert.doesNotThrow(() => audio.play('evento-desconhecido'));
});

test('AudioContext inexistente ou rejeitado não lança', async () => {
  const original = globalThis.AudioContext;
  const originalWebkit = globalThis.webkitAudioContext;
  try {
    globalThis.AudioContext = class {
      constructor() {
        throw new Error('denied');
      }
    };
    globalThis.webkitAudioContext = undefined;
    const mod = await import('../../js/audio.js?rejeitado=1');
    await assert.doesNotReject(() => mod.unlock());
    assert.doesNotThrow(() => mod.play('deal'));
  } finally {
    globalThis.AudioContext = original;
    globalThis.webkitAudioContext = originalWebkit;
  }
});

test('resume rejeitado não lança', async () => {
  const original = globalThis.AudioContext;
  try {
    globalThis.AudioContext = class {
      constructor() {
        this.state = 'suspended';
      }
      resume() {
        return Promise.reject(new Error('blocked'));
      }
    };
    const mod = await import('../../js/audio.js?resume=1');
    await assert.doesNotReject(() => mod.unlock());
    assert.doesNotThrow(() => mod.play('acerto'));
  } finally {
    globalThis.AudioContext = original;
  }
});
