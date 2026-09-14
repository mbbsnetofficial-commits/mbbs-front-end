import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DestinationGlobe } from './destination-globe';
import { countryFrame, earthPosition } from './globe-geography';

// Keep actual Three geometry, camera, scene and OrbitControls. Only the GPU driver is mocked.
class RendererDriverStub {
  domElement = document.createElement('canvas');
  capabilities = { maxTextureSize: 4096, getMaxAnisotropy: () => 1 };
  setClearColor() {}
  setPixelRatio() {}
  getPixelRatio() {
    return 1;
  }
  setSize() {}
  render() {}
  dispose() {}
  forceContextLoss() {}
}

interface RendererState {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  markerPoints: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  uniforms: { sun: { value: THREE.Vector3 } };
  flight?: { start: number; duration: number };
  render(time: number): void;
}
describe('Destination globe interaction and scene geography', () => {
  let host: HTMLDivElement;
  let globe: DestinationGlobe;
  let state: RendererState;
  let terrain: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline imagery')));
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ close: vi.fn() })),
    );
    terrain = vi.fn();
    host = document.createElement('div');
    Object.defineProperties(host, { clientWidth: { value: 1440 }, clientHeight: { value: 819 } });
    document.body.append(host);
    globe = new DestinationGlobe(
      host,
      {
        project: vi.fn(),
        select: vi.fn(),
        moving: vi.fn(),
        terrain: terrain as (state: 'loading' | 'ready' | 'unavailable') => void,
        lost: vi.fn(),
      },
      () => new RendererDriverStub() as unknown as THREE.WebGLRenderer,
    );
    state = globe as unknown as RendererState;
  });
  afterEach(() => {
    globe.dispose();
    host.remove();
    vi.unstubAllGlobals();
  });

  it('leaves wheel events uncancelled and camera position unchanged', () => {
    const before = state.camera.position.clone();
    const event = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
    host.querySelector('canvas')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(state.camera.position.equals(before)).toBe(true);
    expect(state.flight).toBeUndefined();
    expect(state.controls.touches.ONE).toBeNull();
  });
  it('allows explicit zoom without enabling wheel interception', () => {
    const before = state.camera.position.length();
    globe.zoom(1);
    state.render(state.flight!.start + state.flight!.duration);
    expect(state.camera.position.length()).toBeLessThan(before);
    expect(state.controls.enableZoom).toBe(false);
  });
  it.each([
    ['RU', 55.75, 37.62],
    ['KZ', 43.2389, 76.8897],
    ['GE', 41.7151, 44.8271],
    ['HU', 47.4979, 19.0402],
    ['AU', -33.8886, 151.1873],
  ] as const)(
    'places the %s coordinate fixture on the sphere and aligns its texture UV',
    (code, lat, lng) => {
      globe.setAnchors([
        { id: code, label: 'Geographic test fixture', kind: 'university', lat, lng },
      ]);
      const positions = state.markerPoints.geometry.getAttribute('position');
      const point = new THREE.Vector3().fromBufferAttribute(positions, 0);
      expect(point.length()).toBeCloseTo(1.002, 5);
      expect((Math.asin(point.y / point.length()) * 180) / Math.PI).toBeCloseTo(lat, 4);
      expect((-Math.atan2(point.z, point.x) * 180) / Math.PI).toBeCloseTo(lng, 4);
      expect(state.markerPoints.material.depthTest).toBe(true);
      // Independent raycast into Three SphereGeometry confirms UVs match the image meridians.
      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 256, 128),
        new THREE.MeshBasicMaterial(),
      );
      const ray = new THREE.Raycaster(
        point.clone().normalize().multiplyScalar(3),
        point.clone().normalize().negate(),
      );
      const uv = ray.intersectObject(earth)[0].uv!;
      expect(uv.x).toBeCloseTo((lng + 180) / 360, 3);
      expect(uv.y).toBeCloseTo((lat + 90) / 180, 3);
      earth.geometry.dispose();
      earth.material.dispose();
    },
  );
  it.each(['KZ', 'RU', 'GE', 'HU', 'AU'])(
    'targets %s promptly even when imagery fails',
    async (code) => {
      await globe.focus(code);
      expect(state.flight!.duration).toBeLessThanOrEqual(1200);
      state.render(state.flight!.start + state.flight!.duration);
      const frame = countryFrame(code);
      expect(
        state.camera.position
          .clone()
          .normalize()
          .distanceTo(new THREE.Vector3(...earthPosition(frame.lat, frame.lng))),
      ).toBeLessThan(0.00001);
    },
  );
  it('uses cached country terrain before falling back to live imagery', async () => {
    const fetch = vi.fn(async (url: string) => {
      if (url.endsWith('/manifest.json')) {
        return new Response(JSON.stringify({ TR: { url: '/images/earth/countries/TR.jpg' } }));
      }
      if (url === '/images/earth/countries/TR.jpg') {
        return new Response(new Blob(['cached terrain'], { type: 'image/jpeg' }));
      }
      throw new Error('unexpected live imagery request');
    });
    vi.stubGlobal('fetch', fetch);
    await globe.focus('TR');
    expect(fetch).toHaveBeenCalledWith('/images/earth/countries/manifest.json', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/images/earth/countries/TR.jpg', expect.any(Object));
    expect(fetch.mock.calls.some(([url]) => String(url).includes('server.arcgisonline.com'))).toBe(
      false,
    );
    expect(terrain).toHaveBeenLastCalledWith('ready');
  });
  it('keeps sunlight fixed during manual rotation and restores world framing', () => {
    const sun = state.uniforms.sun.value.clone();
    const distance = state.camera.position.length();
    globe.rotate(90);
    state.render(state.flight!.start + state.flight!.duration);
    expect(state.uniforms.sun.value.distanceTo(sun)).toBeLessThan(0.00001);
    globe.reset();
    state.render(state.flight!.start + state.flight!.duration);
    expect(state.camera.position.length()).toBeCloseTo(distance);
    expect(
      state.camera.position
        .clone()
        .normalize()
        .distanceTo(new THREE.Vector3(...earthPosition(24, 48))),
    ).toBeLessThan(0.00001);
  });
  it('removes its canvas and disposes marker GPU resources once', () => {
    const geometry = vi.spyOn(state.markerPoints.geometry, 'dispose');
    const material = vi.spyOn(state.markerPoints.material, 'dispose');
    globe.dispose();
    globe.dispose();
    expect(host.querySelectorAll('canvas')).toHaveLength(0);
    expect(geometry).toHaveBeenCalledTimes(1);
    expect(material).toHaveBeenCalledTimes(1);
  });
  it('does not capture wheel events or change camera distance so page scrolls normally', () => {
    const canvas = host.querySelector('canvas')!;
    const initialDistance = state.camera.position.length();
    const wheelEvent = new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true });
    canvas.dispatchEvent(wheelEvent);
    expect(wheelEvent.defaultPrevented).toBe(false);
    expect(state.camera.position.length()).toBeCloseTo(initialDistance, 5);
  });
});
