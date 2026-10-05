import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldReconnectTransport} from '../Public/src/transport-recovery.mjs';
test('upstream TLS and partial responses preserve other active streams',()=>{
 for(const message of ['Request failed with error code 35: SSL connect error','error code 18: partial file','error code 92: HTTP/2 stream error'])assert.equal(shouldReconnectTransport(Error(message)),false);
});
test('a dropped transport socket reconnects',()=>{
 for(const message of ['WebSocket closed','connection reset','network timeout'])assert.equal(shouldReconnectTransport(Error(message)),true);
});
