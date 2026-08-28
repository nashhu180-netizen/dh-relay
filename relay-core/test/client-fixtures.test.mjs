// client-fixtures.test.mjs — Pi/通用客户端 fixture 只靠 JSON 与冻结 schema 消费。
// 这里刻意不 import 任何 relay runtime/adapter/CLI 代码，防止样例偷依赖 Node 宿主实现。

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { loadAjv, validateOne } from '../tools/validate.mjs';

const fixtures = new URL('../fixtures/clients/', import.meta.url);
const contracts = loadAjv();

async function fixture(name) {
  return JSON.parse(await readFile(new URL(name, fixtures), 'utf8'));
}

function assertSchema(schema, document, label) {
  const result = validateOne(contracts.ajv, contracts.byId, schema, document);
  assert.ok(result.ok, `${label} 必须通过 ${schema}：${result.reason ?? ''}@${result.at ?? ''}`);
}

test('client fixtures：每份 Pi/通用 JSON 都过对应冻结契约', async () => {
  assertSchema('relay.client-read-model/v1', await fixture('pi-run-list.json'), 'pi run list');
  assertSchema('relay.client-read-model/v1', await fixture('pi-status.json'), 'pi status');
  assertSchema('relay.client-read-model/v1', await fixture('pi-detail.json'), 'pi detail');

  const transcript = await fixture('pi-event-stream.json');
  assert.equal(transcript.length, 3, '事件转录 = 一个快照 + 若干事件');
  assertSchema('relay.client-read-model/v1', transcript[0], 'pi event snapshot');
  for (const event of transcript.slice(1)) assertSchema('relay.event/v2', event, 'pi event');

  const receipts = await fixture('generic-control-receipt.json');
  assert.equal(receipts.length, 2, '通用控制 fixture 必须同时给成功与 failed Receipt');
  for (const receipt of receipts) assertSchema('relay.launch-receipt/v2', receipt, 'generic receipt');
});

test('client fixtures：Pi 式中立解析只按 JSON 字段取值', async () => {
  const list = await fixture('pi-run-list.json');
  const status = await fixture('pi-status.json');
  const detail = await fixture('pi-detail.json');
  const stream = await fixture('pi-event-stream.json');
  const receipts = await fixture('generic-control-receipt.json');

  const running = list.items.filter(item => item.group === 'running').map(item => item.run_id);
  const rendered = {
    runId: status.status.run_id,
    host: status.status.host,
    detailNodes: detail.detail.node_states.map(node => `${node.node_id}:${node.status}`),
    afterSeq: stream[0].next_seq - 1,
    replayedSeq: stream.slice(1).map(event => event.seq),
    failedReason: receipts.find(receipt => receipt.state === 'failed').reason,
  };

  assert.deepEqual(running, ['RUN-1']);
  assert.deepEqual(rendered, {
    runId: 'RUN-1', host: 'alive', detailNodes: ['fix:succeeded', 'review3:running'],
    afterSeq: 6, replayedSeq: [7, 8], failedReason: 'E_LEGACY_READ_ONLY',
  });
});
