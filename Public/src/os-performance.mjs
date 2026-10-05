export function useLightEffects(saved,width,cores,memory){
 if(saved==='true')return true;
 if(saved==='false')return false;
 return width<=1500||(cores>0&&cores<=4)||(memory>0&&memory<=4);
}
