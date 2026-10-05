import test from 'node:test';
import assert from 'node:assert/strict';
import {apiResponse} from '../Public/src/api-response.mjs';
test('payment response produces actionable error instead of JSON crash',async()=>{
 await assert.rejects(apiResponse(new Response('Payment required',{status:402})),e=>e.status===402&&e.message.includes('Vercel'));
});
test('HTML failures and malformed success responses fail clearly',async()=>{
 for(const body of ['<html>Error</html>','null','[]'])await assert.rejects(apiResponse(new Response(body)),/Nova/);
});
test('valid error and success JSON are preserved',async()=>{
 assert.deepEqual(await apiResponse(new Response('{"error":"Sign in"}',{status:401})),{error:'Sign in'});
 assert.deepEqual(await apiResponse(new Response('{"ok":true}')),{ok:true});
});
