const potrace = require('potrace');
const fs = require('fs');

const imagePath = '/Users/ilayabharathi/.gemini/antigravity/brain/tempmediaStorage/media_1786705479248.png';

potrace.trace(imagePath, { threshold: 120, blackOnWhite: true }, function(err, svg) {
  if (err) {
    console.error(err);
    return;
  }
  
  // Extract path data
  const match = svg.match(/<path d="([^"]+)"/);
  if (!match) {
    console.log("No path found");
    return;
  }
  
  const rawPath = match[1];
  
  // Extract viewBox to scale it
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  let originalWidth = 200, originalHeight = 200;
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(' ');
    originalWidth = parseFloat(parts[2]);
    originalHeight = parseFloat(parts[3]);
  }
  
  // Scale to 24x24
  const targetSize = 24;
  const scaleX = targetSize / originalWidth;
  const scaleY = targetSize / originalHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85; // leave some padding
  
  const dx = (targetSize - originalWidth * scale) / 2;
  const dy = (targetSize - originalHeight * scale) / 2;
  
  const newPath = rawPath.replace(/([0-9.]+)/g, (matchStr) => {
      // Very naive scaling, assuming alternating x and y if it's absolute
      // Actually potrace usually gives relative coordinates (l, c, etc.) which complicates naive regex scaling.
      // Let's just output the raw SVG and we will use an SVG optimiser or scale it differently.
      return matchStr;
  });
  
  console.log("Raw viewBox:", originalWidth, "x", originalHeight);
  fs.writeFileSync('trace_out.svg', svg);
  console.log("SVG written to trace_out.svg");
});
