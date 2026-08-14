const fs = require('fs');
// Let's use Jimp since it was installed as a dependency of potrace
const Jimp = require('jimp');

Jimp.read('src/assets/icons/uk-map.png').then(image => {
  console.log("Width:", image.bitmap.width, "Height:", image.bitmap.height);
  const color1 = image.getPixelColor(image.bitmap.width/2, image.bitmap.height/2);
  const color2 = image.getPixelColor(0, 0);
  console.log("Center Pixel:", color1.toString(16));
  console.log("Corner Pixel:", color2.toString(16));
}).catch(err => console.error(err));
