const fs = require('fs');

const indiaPath = "M150 20 L160 40 L180 45 L190 35 L200 50 L210 45 L220 60 L215 80 L230 90 L240 85 L250 100 L240 120 L250 140 L240 160 L230 150 L220 170 L200 160 L190 180 L180 170 L170 190 L160 180 L150 200 L140 190 L130 210 L120 200 L110 220 L100 210 L90 230 L80 220 L70 240 L80 260 L90 270 L110 280 L120 310 L140 330 L160 320 L180 300 L190 280 L200 290 L220 280 L230 260 L240 250 L250 220 L260 210 L270 190 L280 160 L270 140 L260 130 L250 110 Z";

function scalePath(path, originalWidth, originalHeight, targetSize) {
    const scaleX = targetSize / originalWidth;
    const scaleY = targetSize / originalHeight;
    const scale = Math.min(scaleX, scaleY) * 0.8; // 80% to leave some padding
    const dx = (targetSize - originalWidth * scale) / 2;
    const dy = (targetSize - originalHeight * scale) / 2;
    
    return path.replace(/([0-9.]+)/g, (match) => {
        return (parseFloat(match) * scale).toFixed(1);
    });
}

// India is roughly 300x350 as per the viewBox 0 0 300 350
// But let's find the actual bounds
const coords = indiaPath.match(/([0-9.]+)/g).map(Number);
const xs = coords.filter((_, i) => i % 2 === 0);
const ys = coords.filter((_, i) => i % 2 === 1);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);

const width = maxX - minX;
const height = maxY - minY;
const scale = Math.min(20 / width, 20 / height);
const dx = 12 - (minX + width / 2) * scale;
const dy = 12 - (minY + height / 2) * scale;

let isX = true;
const newPath = indiaPath.replace(/([0-9.]+)/g, (match) => {
    const val = parseFloat(match);
    const scaled = val * scale + (isX ? dx : dy);
    isX = !isX;
    return scaled.toFixed(1);
});

console.log("India Scaled:", newPath);
