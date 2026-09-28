# Your Nova backgrounds
Put your JPG, PNG, WebP, GIF, MP4 or WebM files in this folder. No backgrounds have been added.
Then edit `presets.json`, for example:

```json
[
  {"name":"My image","src":"backgrounds/my-image.jpg","type":"image"},
  {"name":"My GIF","src":"backgrounds/my-animation.gif","type":"image"},
  {"name":"My video","src":"backgrounds/my-video.mp4","type":"video","poster":"backgrounds/my-preview.jpg"}
]
```
Use real filenames. Keep filenames simple and videos short/compressed. `poster` is optional.
Refresh Settings after editing. Selecting one updates Nova Home and Search. Videos play muted.
Keep this JSON an array; separate entries with commas, with no trailing comma.
