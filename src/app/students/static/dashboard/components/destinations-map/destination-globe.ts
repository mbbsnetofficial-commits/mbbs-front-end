import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NATURAL_EARTH_COUNTRIES, projectCoordinates } from './destinations-geo.data';
import {
  countryFrame,
  earthPosition,
  focusDistance,
  satelliteUrl,
  type GeoPoint,
} from './globe-geography';

export interface GlobeAnchor extends GeoPoint {
  id: string;
  label: string;
  kind: 'country' | 'university';
}
export interface ScreenAnchor extends GlobeAnchor {
  x: number;
  y: number;
  showLabel: boolean;
}
interface Flight {
  from: THREE.Spherical;
  to: THREE.Spherical;
  start: number;
  duration: number;
  done?: () => void;
  sunFrom: THREE.Vector3;
  sunTo: THREE.Vector3;
}
interface CountryTextureManifest {
  [code: string]: { url: string };
}

/** Owns GPU resources and interaction. Angular owns API data, accessible controls and details. */
export class DestinationGlobe {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.005, 30);
  private readonly controls: OrbitControls;
  private readonly geometry = new THREE.SphereGeometry(1, 128, 80);
  private readonly material: THREE.ShaderMaterial;
  private readonly atmosphereMaterial: THREE.ShaderMaterial;
  private readonly earth: THREE.Mesh;
  private readonly markerMaterial: THREE.ShaderMaterial;
  private readonly markerPoints: THREE.Points;
  private readonly resizeObserver: ResizeObserver;
  private readonly raycaster = new THREE.Raycaster();
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly requests = new AbortController();
  private terrainRequest?: AbortController;
  private readonly events = new AbortController();
  private readonly motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private anchors: GlobeAnchor[] = [];
  private country = '';
  private frameId = 0;
  private visible = true;
  private disposed = false;
  private flight?: Flight;
  private generation = 0;
  private countryTextureManifest?: Promise<CountryTextureManifest>;
  private width = 1;
  private height = 1;
  private worldDistance = 4;
  private pointerStart = { x: 0, y: 0 };
  private dragged = false;
  private hitContext?: CanvasRenderingContext2D;
  private paths?: { code: string; path: Path2D }[];
  private patchFade = 0;
  private readonly uniforms = {
    day: { value: new THREE.Texture() },
    detail: { value: new THREE.Texture() },
    region: { value: new THREE.Vector4(0, 0, 1, 1) },
    detailMix: { value: 0 },
    sun: { value: new THREE.Vector3(...earthPosition(40, 5)) },
    normalMap: { value: new THREE.Texture() },
    waterMap: { value: new THREE.Texture() },
    surfaceReady: { value: 0 },
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly callbacks: {
      project: (anchors: ScreenAnchor[]) => void;
      select: (code: string) => void;
      moving: (moving: boolean) => void;
      terrain: (state: 'loading' | 'ready' | 'unavailable') => void;
      lost: () => void;
    },
    createRenderer: () => THREE.WebGLRenderer = () =>
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      }),
  ) {
    this.renderer = createRenderer();
    this.renderer.setClearColor(0x0b0d0d, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.style.cssText =
      'display:block;width:100%;height:100%;touch-action:pan-y;';
    this.host.appendChild(this.renderer.domElement);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
        void main() { vUv=uv; vNormal=normalize(mat3(modelMatrix)*normal);
          vWorld=(modelMatrix*vec4(position,1.)).xyz;
          gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.); }`,
      fragmentShader: `uniform sampler2D day; uniform sampler2D detail; uniform vec4 region;
        uniform sampler2D normalMap; uniform sampler2D waterMap; uniform float surfaceReady;
        uniform float detailMix; uniform vec3 sun;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
        void main() {
          vec3 base=texture2D(day,vUv).rgb;
          vec2 p=(vUv-region.xy)/(region.zw-region.xy);
          float edge=smoothstep(0.,.06,p.x)*smoothstep(0.,.06,p.y)*smoothstep(0.,.06,1.-p.x)*smoothstep(0.,.06,1.-p.y);
          vec3 terrain=texture2D(detail,clamp(p,0.,1.)).rgb;
          base=mix(base,terrain,edge*detailMix);
          vec3 N=normalize(vNormal), V=normalize(cameraPosition-vWorld);
          float water=texture2D(waterMap,vUv).r*surfaceReady;
          // Tangent basis follows increasing geographic longitude and latitude.
          vec3 T=normalize(vec3(N.z,0.,-N.x));
          vec3 B=normalize(cross(N,T));
          vec3 relief=texture2D(normalMap,vUv).xyz*2.-1.;
          vec3 normal=normalize(N+(T*relief.x+B*relief.y)*.22*(1.-water)*surfaceReady);
          float diffuse=max(0.,dot(normal,sun));
          float daylight=smoothstep(-.08,.18,dot(N,sun));
          float rim=pow(1.-max(0.,dot(N,V)),4.);
          vec3 color=base*(.045+1.1*diffuse);
          // Low Fresnel reflectance over water; land remains matte.
          float fresnel=.02+.12*pow(1.-max(0.,dot(N,V)),5.);
          float specular=pow(max(0.,dot(normal,normalize(sun+V))),65.);
          color+=vec3(.9,.93,.94)*water*specular*fresnel*3.*daylight;
          color+=vec3(.18,.24,.28)*rim*daylight*.23;
          gl_FragColor=vec4(color,1.);
          #include <colorspace_fragment>
        }`,
    });
    this.earth = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.earth);
    // The visible dots are GPU points in Earth coordinates, depth-tested against terrain.
    // DOM projections below provide labels and keyboard/click hit targets only.
    this.markerMaterial = new THREE.ShaderMaterial({
      uniforms: { dpr: { value: this.renderer.getPixelRatio() } },
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexShader: `attribute float campus; uniform float dpr; varying float vCampus;
        void main(){vCampus=campus;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
          gl_PointSize=(campus>.5?7.:5.)*dpr;}`,
      fragmentShader: `varying float vCampus;
        void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
          vec3 color=mix(vec3(.76,.97,.08),vec3(.94,.95,.9),vCampus*smoothstep(.28,.42,r));
          gl_FragColor=vec4(color,1.-smoothstep(.42,.5,r));
          #include <colorspace_fragment>
        }`,
    });
    this.markerPoints = new THREE.Points(new THREE.BufferGeometry(), this.markerMaterial);
    this.scene.add(this.markerPoints);
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: { sun: this.uniforms.sun },
      vertexShader: `varying vec3 vNormal; varying vec3 vView;
        void main(){vec4 p=modelMatrix*vec4(position,1.);vNormal=normalize(mat3(modelMatrix)*normal);vView=normalize(cameraPosition-p.xyz);gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader: `uniform vec3 sun; varying vec3 vNormal; varying vec3 vView;
        void main(){vec3 N=normalize(vNormal);float rim=pow(1.-abs(dot(N,normalize(vView))),3.);
          float day=smoothstep(-.15,.4,dot(N,sun));gl_FragColor=vec4(.46,.58,.65,rim*.28*day);}`,
    });
    const atmosphere = new THREE.Mesh(this.geometry, this.atmosphereMaterial);
    atmosphere.scale.setScalar(1.009);
    this.scene.add(atmosphere);
    this.camera.position.fromArray(earthPosition(24, 48, 4));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    // Explicit +/- zoom only. OrbitControls returns before preventDefault when disabled.
    // A wheel anywhere in this full-width landing section must scroll the document.
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.rotateSpeed = 0.45;
    this.controls.zoomSpeed = 0.65;
    this.controls.minDistance = 1.18;
    this.controls.maxDistance = 6;
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = Math.PI - 0.08;
    // One finger is exclusively page scrolling; two fingers rotate. +/- also work on touch.
    this.controls.touches.ONE = null;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    this.renderer.domElement.style.touchAction = 'pan-y';
    this.controls.addEventListener('start', () => {
      this.cancelFlight();
      this.requestRender();
    });
    this.controls.addEventListener('change', () => this.requestRender());
    const canvas = this.renderer.domElement;
    const options = { signal: this.events.signal };
    canvas.addEventListener(
      'pointerdown',
      (e) => {
        this.pointerStart = { x: e.clientX, y: e.clientY };
        this.dragged = false;
      },
      options,
    );
    canvas.addEventListener(
      'pointermove',
      (e) => {
        if (Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y) > 5)
          this.dragged = true;
      },
      options,
    );
    canvas.addEventListener(
      'click',
      (e) => {
        if (!this.dragged) this.pickCountry(e);
      },
      options,
    );
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        this.callbacks.lost();
      },
      options,
    );
    document.addEventListener('visibilitychange', () => this.requestRender(), options);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  async initialize(): Promise<void> {
    const size = this.width < 700 || this.renderer.capabilities.maxTextureSize < 4096 ? 2048 : 4096;
    const texture = await this.loadTexture(`/images/earth/blue-marble-${size}.jpg`);
    if (this.disposed) {
      texture.dispose();
      return;
    }
    this.uniforms.day.value.dispose();
    this.uniforms.day.value = texture;
    this.textures.set('world', texture);
    // Enhancement maps are small and optional; a failed enhancement cannot hide the Earth.
    const surface = await Promise.allSettled([
      this.loadTexture('/images/earth/earth-normal-2048.jpg'),
      this.loadTexture('/images/earth/earth-water-2048.jpg'),
    ]);
    for (const [i, result] of surface.entries()) {
      if (result.status !== 'fulfilled') continue;
      if (this.disposed) {
        this.releaseTexture(result.value);
        continue;
      }
      result.value.colorSpace = THREE.NoColorSpace;
      const uniform = i === 0 ? this.uniforms.normalMap : this.uniforms.waterMap;
      uniform.value.dispose();
      uniform.value = result.value;
    }
    if (this.disposed) return;
    this.uniforms.surfaceReady.value = surface.every((r) => r.status === 'fulfilled') ? 1 : 0;
    await this.renderer.compileAsync(this.scene, this.camera);
    if (!this.disposed) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
      this.render(performance.now());
    }
  }

  private async loadTexture(url: string, signal?: AbortSignal): Promise<THREE.Texture> {
    const signals = [this.requests.signal, AbortSignal.timeout(12000)];
    if (signal) signals.push(signal);
    const response = await fetch(url, { signal: AbortSignal.any(signals) });
    if (!response.ok) throw new Error('Imagery unavailable');
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'flipY' });
    if (this.disposed) {
      bitmap.close();
      throw new Error('Disposed');
    }
    const texture = new THREE.Texture(bitmap);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }

  setAnchors(anchors: GlobeAnchor[]): void {
    this.anchors = anchors;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        anchors.flatMap((a) => earthPosition(a.lat, a.lng, 1.002)),
        3,
      ),
    );
    geometry.setAttribute(
      'campus',
      new THREE.Float32BufferAttribute(
        anchors.map((a) => (a.kind === 'university' ? 1 : 0)),
        1,
      ),
    );
    geometry.computeBoundingSphere();
    // Dispose the old buffers when API data or country selection replaces the point set.
    this.markerPoints.geometry.dispose();
    this.markerPoints.geometry = geometry;
    this.requestRender();
  }
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    } else this.requestRender();
  }

  async focus(code: string): Promise<void> {
    this.terrainRequest?.abort();
    this.terrainRequest = new AbortController();
    this.country = code;
    const token = ++this.generation;
    const frame = countryFrame(code);
    this.callbacks.moving(true);
    this.callbacks.terrain('loading');
    this.uniforms.detailMix.value = 0;
    this.patchFade = 0;
    // Geography, not network latency, controls the camera. Terrain fades in independently.
    const distance = Math.min(
      this.worldDistance,
      focusDistance(frame.radius, this.camera.fov, this.camera.aspect),
    );
    this.fly(
      frame,
      distance,
      1150,
      () => this.callbacks.moving(false),
      new THREE.Vector3(...earthPosition(Math.min(80, frame.lat + 15), frame.lng - 35)),
    );
    let detailReady = false;
    try {
      let texture = this.textures.get(code);
      if (!texture) {
        texture = await this.loadCountryTexture(code, frame, this.terrainRequest.signal);
        if (this.disposed || token !== this.generation) {
          this.releaseTexture(texture);
          return;
        }
        this.textures.set(code, texture);
        // Bound GPU residency to world + three regional images.
        if (this.textures.size > 4) {
          const key = [...this.textures.keys()].find((k) => k !== 'world' && k !== code)!;
          this.releaseTexture(this.textures.get(key)!);
          this.textures.delete(key);
        }
      }
      if (this.disposed || token !== this.generation) return;
      const [w, s, e, n] = frame.bounds;
      if (!this.uniforms.detail.value.image) this.uniforms.detail.value.dispose();
      this.uniforms.detail.value = texture;
      this.uniforms.region.value.set(
        (w + 180) / 360,
        (s + 90) / 180,
        (e + 180) / 360,
        (n + 90) / 180,
      );
      this.patchFade = performance.now();
      detailReady = true;
      this.requestRender();
    } catch {
      if (this.disposed || token !== this.generation) return;
    }
    if (token !== this.generation) return;
    this.callbacks.terrain(detailReady ? 'ready' : 'unavailable');
  }

  focusLocation(point: GeoPoint): void {
    this.flight = undefined;
    const distance = THREE.MathUtils.clamp(this.camera.position.length() * 0.82, 1.2, 1.62);
    this.callbacks.moving(true);
    this.fly(
      point,
      distance,
      760,
      () => this.callbacks.moving(false),
      new THREE.Vector3(...earthPosition(Math.min(80, point.lat + 18), point.lng - 28)),
    );
  }

  reset(): void {
    this.terrainRequest?.abort();
    ++this.generation;
    this.country = '';
    this.uniforms.detailMix.value = 0;
    this.patchFade = 0;
    this.callbacks.moving(true);
    this.fly(
      { lat: 24, lng: 48 },
      this.worldDistance,
      1100,
      () => this.callbacks.moving(false),
      new THREE.Vector3(...earthPosition(40, 5)),
    );
  }

  private cancelFlight(): void {
    ++this.generation;
    this.terrainRequest?.abort();
    this.flight = undefined;
    this.callbacks.moving(false);
    if (this.country)
      this.callbacks.terrain(this.uniforms.detailMix.value > 0 ? 'ready' : 'unavailable');
  }

  private async loadCountryTexture(
    code: string,
    frame: ReturnType<typeof countryFrame>,
    signal: AbortSignal,
  ): Promise<THREE.Texture> {
    const manifest = await this.getCountryTextureManifest();
    signal.throwIfAborted();
    const localUrl = manifest[code]?.url;
    if (localUrl) {
      try {
        return await this.loadTexture(localUrl, signal);
      } catch {
        signal.throwIfAborted();
        // Fall through to live imagery if a cached file is missing or corrupt.
      }
    }
    return this.loadTexture(satelliteUrl(frame.bounds, this.width < 700 ? 1536 : 2048), signal);
  }

  private getCountryTextureManifest(): Promise<CountryTextureManifest> {
    this.countryTextureManifest ??= fetch('/images/earth/countries/manifest.json', {
      signal: AbortSignal.any([this.requests.signal, AbortSignal.timeout(12000)]),
    })
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
    return this.countryTextureManifest;
  }

  zoom(direction: number): void {
    this.cancelFlight();
    const spherical = new THREE.Spherical().setFromVector3(this.camera.position);
    this.fly(
      {
        lat: 90 - THREE.MathUtils.radToDeg(spherical.phi),
        lng: -THREE.MathUtils.radToDeg(Math.atan2(this.camera.position.z, this.camera.position.x)),
      },
      THREE.MathUtils.clamp(
        spherical.radius * (direction > 0 ? 0.85 : 1.18),
        1.18,
        this.controls.maxDistance,
      ),
      450,
    );
  }

  rotate(delta: number): void {
    this.cancelFlight();
    const p = this.camera.position;
    this.fly(
      {
        lat: 90 - THREE.MathUtils.radToDeg(new THREE.Spherical().setFromVector3(p).phi),
        lng: -THREE.MathUtils.radToDeg(Math.atan2(p.z, p.x)) + delta,
      },
      p.length(),
      400,
    );
  }

  private fly(
    point: GeoPoint,
    distance: number,
    duration: number,
    done?: () => void,
    sunlight = this.uniforms.sun.value,
  ): void {
    // Clear residual drag damping before a geographic flight takes ownership of the camera.
    const damping = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = damping;
    const from = new THREE.Spherical().setFromVector3(this.camera.position);
    const to = new THREE.Spherical().setFromVector3(
      new THREE.Vector3(...earthPosition(point.lat, point.lng, distance)),
    );
    to.theta =
      from.theta +
      THREE.MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) -
      Math.PI;
    this.flight = {
      from,
      to,
      start: performance.now(),
      duration: this.motion.matches ? 0 : duration,
      done,
      sunFrom: this.uniforms.sun.value.clone(),
      sunTo: sunlight.clone(),
    };
    this.requestRender();
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth),
      height = Math.max(1, this.host.clientHeight);
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.camera.aspect = this.width / this.height;
    this.camera.clearViewOffset();
    const radiusPixels = Math.min(this.height * 0.43, this.width * 0.44);
    this.worldDistance = Math.sqrt(
      1 +
        Math.pow(
          this.height /
            (2 * radiusPixels * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))),
          2,
        ),
    );
    this.controls.maxDistance = this.worldDistance * 1.4;
    this.renderer.setSize(this.width, this.height, false);
    const distance = this.country
      ? Math.min(
          this.worldDistance,
          focusDistance(countryFrame(this.country).radius, this.camera.fov, this.camera.aspect),
        )
      : this.worldDistance;
    if (this.flight) this.flight.to.radius = distance;
    else this.camera.position.setLength(distance);
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }

  private requestRender(): void {
    if (!this.frameId && this.visible && !this.disposed && !document.hidden)
      this.frameId = requestAnimationFrame((now) => this.render(now));
  }

  private render(now: number): void {
    this.frameId = 0;
    if (this.disposed) return;
    if (this.flight) {
      const f = this.flight;
      const t = f.duration ? Math.min(1, (now - f.start) / f.duration) : 1;
      const eased = t * t * t * (t * (t * 6 - 15) + 10);
      this.uniforms.sun.value.lerpVectors(f.sunFrom, f.sunTo, eased).normalize();
      this.camera.position.setFromSpherical(
        new THREE.Spherical(
          THREE.MathUtils.lerp(f.from.radius, f.to.radius, eased),
          THREE.MathUtils.lerp(f.from.phi, f.to.phi, eased),
          THREE.MathUtils.lerp(f.from.theta, f.to.theta, eased),
        ),
      );
      if (t === 1) {
        this.flight = undefined;
        f.done?.();
      }
    }
    const changed = this.controls.update();
    this.camera.updateMatrixWorld();
    // Sunlight stays fixed during manual rotation, exposing a real day/night terminator.
    if (this.patchFade && this.country)
      this.uniforms.detailMix.value = Math.min(1, (now - this.patchFade) / 450);
    this.renderer.render(this.scene, this.camera);
    const visible: ScreenAnchor[] = [];
    for (const anchor of this.anchors) {
      const point = new THREE.Vector3(...earthPosition(anchor.lat, anchor.lng, 1.002));
      // Perspective horizon test: front hemisphere alone is insufficient at close range.
      if (point.dot(this.camera.position.clone().sub(point)) <= 0.005) continue;
      const projected = point.project(this.camera);
      if (Math.abs(projected.x) > 0.94 || Math.abs(projected.y) > 0.94 || projected.z > 1) continue;
      const x = ((projected.x + 1) * this.width) / 2,
        y = ((1 - projected.y) * this.height) / 2;
      visible.push({ ...anchor, x, y, showLabel: false });
    }
    const labels: { x: number; y: number; width: number }[] = [];
    const priority = ['KZ', 'RU', 'GE', 'HU', 'AU'];
    visible.sort(
      (a, b) =>
        (priority.includes(a.id) ? priority.indexOf(a.id) : 99) -
        (priority.includes(b.id) ? priority.indexOf(b.id) : 99),
    );
    for (const anchor of visible) {
      const width = anchor.label.length * 5.8 + 12;
      const x = anchor.x + 8,
        y = anchor.y - 6;
      const collides =
        visible.some(
          (p) =>
            p !== anchor && p.x > x - 4 && p.x < x + width + 4 && Math.abs(p.y - anchor.y) < 12,
        ) ||
        labels.some(
          (p) => x < p.x + p.width + 8 && x + width > p.x - 8 && Math.abs(y - p.y) < 22,
        ) ||
        x + width > this.width - 16;
      anchor.showLabel = !collides;
      if (!collides) labels.push({ x, y, width });
    }
    this.callbacks.project(visible);
    if (
      this.flight ||
      changed ||
      (this.patchFade && this.country && this.uniforms.detailMix.value < 1)
    )
      this.requestRender();
  }

  private pickCountry(event: MouseEvent): void {
    if (this.country || this.flight) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      ),
      this.camera,
    );
    const hit = this.raycaster.intersectObject(this.earth)[0];
    if (!hit) return;
    const p = hit.point.normalize();
    const [x, y] = projectCoordinates(
      -THREE.MathUtils.radToDeg(Math.atan2(p.z, p.x)),
      THREE.MathUtils.radToDeg(Math.asin(p.y)),
    );
    this.hitContext ??= document.createElement('canvas').getContext('2d') ?? undefined;
    this.paths ??= NATURAL_EARTH_COUNTRIES.filter((c) => c.code !== '-99').map((c) => ({
      code: c.code,
      path: new Path2D(c.d),
    }));
    const country = this.paths.find((c) => this.hitContext?.isPointInPath(c.path, x, y, 'evenodd'));
    if (country) this.callbacks.select(country.code);
  }

  private releaseTexture(texture: THREE.Texture): void {
    texture.dispose();
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap)
      texture.image.close();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    ++this.generation;
    cancelAnimationFrame(this.frameId);
    this.requests.abort();
    this.events.abort();
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.atmosphereMaterial.dispose();
    this.markerPoints.geometry.dispose();
    this.markerMaterial.dispose();
    new Set([
      ...this.textures.values(),
      this.uniforms.day.value,
      this.uniforms.detail.value,
      this.uniforms.normalMap.value,
      this.uniforms.waterMap.value,
    ]).forEach((t) => this.releaseTexture(t));
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
