export const NEW_WINDOW=7*24*60*60*1000;
export function isNewLibraryItem(addedAt,now=Date.now()){
 if(!addedAt)return false;const date=Date.parse(addedAt);return Number.isFinite(date)&&now>=date&&now-date<NEW_WINDOW;
}
