import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import handler from '../api/account.js';

function response() {
  return {statusCode: 200, headers: {}, setHeader(k,v) {this.headers[k]=v;}, end(body) {this.body=JSON.parse(body);}};
}
test('Hobby deployment stays within 12 functions and keeps account URLs', async () => {
  const files = await readdir(new URL('../api/', import.meta.url));
  assert.ok(files.filter(f=>f.endsWith('.js')).length <= 12);
  const config = JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
  for (const route of ['account-login','login-handoff','secure-appeal']) {
    assert.equal(config.rewrites.find(r=>r.source==='/api/'+route)?.destination,'/api/account?novaEndpoint='+route);
  }
});
test('account dispatcher preserves login method checks', async () => {
  const res=response();
  await handler({url:'/api/account?novaEndpoint=account-login',method:'GET',headers:{host:'novaoffical.vercel.app'}},res);
  assert.equal(res.statusCode,405);
});
test('account dispatcher preserves handoff origin checks', async () => {
  const res=response();
  await handler({url:'/api/account?novaEndpoint=login-handoff',method:'POST',headers:{origin:'http://untrusted.local'}},res);
  assert.equal(res.statusCode,403);
});
test('unknown dispatcher routes cannot access arbitrary handlers', async () => {
  for(const route of ['owner-control','toString','__proto__']) {
    const res=response();
    await handler({url:'/api/account?novaEndpoint='+route},res);
    assert.equal(res.statusCode,404);
  }
});
