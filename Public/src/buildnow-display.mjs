export const resolutionPresets={native:null,'1024x768':[1024,768],'1280x960':[1280,960],'1440x1080':[1440,1080],'1280x1024':[1280,1024]};
export function displaySettings(value,{width,height,potato=false,pixelRatio=1}){const preset=resolutionPresets[value];if(preset)return {width:preset[0],height:preset[1],matchWebGLToCanvasSize:false,devicePixelRatio:1};return {width,height,matchWebGLToCanvasSize:true,devicePixelRatio:potato?.65:pixelRatio}}
export function inspectRuntime(instance){const module=instance?.Module||{};const exported=Object.keys(module).filter(k=>typeof module[k]==='function');return {exportedFunctions:exported.length,cameraHooks:exported.filter(k=>/field.?of.?view|camera.?fov/i.test(k)),weaponHooks:exported.filter(k=>/fire.?weapon|raycast|bullet|hit.?player/i.test(k))}}

export const buildNowSettingKeys=['nova-lol-appearance-v1','nova-lol-practice-bindings-v2','nova_buildnow_potato','nova_buildnow_resolution','nova_buildnow_stretch','nova_buildnow_zoom','nova_buildnow_camera_fov'];
export function resetBuildNowSettings(storage){for(const key of buildNowSettingKeys)storage.removeItem(key)}

export const fovProjectionScale=degrees=>1/Math.tan(Math.max(60,Math.min(120,Number(degrees)||90))*Math.PI/360);
