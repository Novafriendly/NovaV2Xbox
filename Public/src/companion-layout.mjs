export function companionRect(game,width,height){if(!game||game.w>width*.55||game.w<width*.2)return null;const onRight=game.x>=width*.4;return {x:onRight?0:width/2,y:0,w:width/2,h:height}}
