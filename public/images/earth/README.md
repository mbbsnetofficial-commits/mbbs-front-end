# Satellite imagery

`blue-marble-4096.jpg` (811 KB) and `blue-marble-2048.jpg` (242 KB): NASA
Earth Observatory, Blue Marble: Next Generation, August 2004, base map with
topography. Resampled from the 5400 × 2700 original with bicubic filtering,
JPEG quality 88. Smaller screens load the 2048 version only.

Source: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/
Original: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/august/world.topo.200408.3x5400x2700.jpg

The equirectangular image is self-hosted so globe readiness does not
depend on a third-party image host. It includes shaded relief; no artificial
height information is inferred from the color photograph.

Country detail is requested on demand from the existing Esri World Imagery
service. Its geographic bounds are sampled on the same sphere with feathered
edges; no country polygon is drawn. Source credits: Esri, Maxar, Earthstar
Geographics, and the GIS User Community. Credits are retained here without
adding attribution controls to the visible design.

Surface lighting maps: Three.js example assets, earth_normal_2048.jpg and
earth_specular_2048.jpg, from https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets.
The normal map supplies restrained terrain shading; the specular map is a water mask.
They use the same equirectangular meridians as the NASA day texture and are sampled
as linear data, not sRGB color. No synthetic relief is generated from color imagery.
Three.js license: https://github.com/mrdoob/three.js/blob/dev/LICENSE.

Sunlight is illustrative rather than an astronomical clock. It stays fixed during
manual orbit, and eases to illuminate a newly selected destination. Clouds are
omitted to keep campus locations unobscured and avoid an idle animation loop.
