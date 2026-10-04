import test from 'node:test';
import assert from 'node:assert/strict';
import {musicArtworkCandidates,loadedMusicArtwork,copyMusicArtwork} from '../Public/src/music-art.mjs';
test('prefers the rendered provider artwork and includes object and array fallbacks',()=>{
 const doc={querySelectorAll:()=>[{currentSrc:'https://nova.example/~/sj/p/art',style:{},getAttribute:()=>null}]};
 assert.deepEqual(musicArtworkCandidates({pic:{url:'https://art.example/song.jpg'},thumbnails:[{src:'https://art.example/small.jpg'}]},doc),['https://nova.example/~/sj/p/art','https://art.example/song.jpg','https://art.example/small.jpg']);
});
test('extracts background artwork and deduplicates without inventing a Nova-logo cover',()=>{
 const doc={querySelectorAll:()=>[{style:{backgroundImage:'url("https://art.example/cover.jpg")'},getAttribute:()=>null}]};
 assert.deepEqual(musicArtworkCandidates({cover:'https://art.example/cover.jpg'},doc),['https://art.example/cover.jpg']);
 assert.deepEqual(musicArtworkCandidates(null,null),[]);
});

test('reuses the decoded relay cover and skips placeholders and unloaded images',()=>{const cover={complete:true,naturalWidth:512,currentSrc:'https://nova.example/relay/cover',classList:{contains:()=>false}};const doc={querySelectorAll:()=>[{...cover,currentSrc:'cover-fallback.svg'},{...cover,complete:false},cover]};assert.equal(loadedMusicArtwork(doc),cover);let drawn;const canvas={getContext:()=>({drawImage:(...args)=>drawn=args}),toDataURL:type=>{assert.equal(type,'image/png');return 'data:image/png;base64,cover'}};assert.equal(copyMusicArtwork(cover,canvas),'data:image/png;base64,cover');assert.equal(drawn[0],cover);assert.equal(canvas.width,96);assert.equal(copyMusicArtwork({...cover,complete:false},canvas),null)});
test('a tainted or inaccessible cover falls back without breaking music controls',()=>{assert.equal(copyMusicArtwork({complete:true,naturalWidth:64},{getContext:()=>({drawImage(){throw Error('SecurityError')}})}),null)});
