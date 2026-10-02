import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {crc32} from 'node:zlib';
import {twiceAnimatedPNG} from '../Public/src/profile-effect.js';

test('all forty animated profile effects play twice with a valid PNG checksum',()=>{
 const folder='Public/profile-assets/ProfileEffect/';const files=readdirSync(folder);assert.equal(files.length,40);
 for(const file of files){const original=readFileSync(folder+file),input=original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength),output=Buffer.from(twiceAnimatedPNG(input));
 const type=output.indexOf('acTL'),start=type-4;assert(type>=0,file);assert.equal(output.readUInt32BE(type+8),2,file);
 assert.equal(output.readUInt32BE(type+12),crc32(output.subarray(type,type+12)),file);
 assert.equal(output.length,original.length);assert.deepEqual(output.subarray(0,start),original.subarray(0,start));assert.deepEqual(output.subarray(type+16),original.subarray(type+16));assert.deepEqual(Buffer.from(input),original,'Source artwork remains unchanged');
 }
});
test('static or unsupported images remain unchanged',()=>{const bytes=new Uint8Array([1,2,3,4]);assert.deepEqual(twiceAnimatedPNG(bytes.buffer),bytes)});
