import {leaderboardGames} from './leaderboard.mjs';
export async function validateShowcase(value,getGames=leaderboardGames){
 if(!Array.isArray(value)||value.length>3||value.some(key=>typeof key!=='string'))throw Error('Choose up to three favorite games.');
 const known=new Set((await getGames()).filter(g=>!g.key.startsWith('app:')).map(g=>g.key));
 if(value.some(key=>!known.has(key))||new Set(value).size!==value.length)throw Error('Choose distinct games from the Nova collection.');
 return [...value];
}
