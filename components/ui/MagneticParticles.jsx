'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const PARTICLES_EXPLODE_EVENT = 'futur-one-particles-explode';

const HERO_SCALE = 2.8;
const FADE_DURATION_S = 0.9;
const FADE_START_DELAY_S = 0.35;

class ParticleSystem {
  constructor(container, imageUrl, color, particleCount = 45000) {
    this.container = container;
    this.imageUrl = imageUrl;
    this.color = color;
    this.count = particleCount;
    this.forming = true;
    this.baseOpacity = 0.9;
    this.fadeElapsed = -1;
    this.fadeDone = false;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector3(9999, 9999, 9999);
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.normalizedCoords = [];

    this.isMobile = matchMedia('(pointer: coarse)').matches;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onExplodeEvent = this.onExplodeEvent.bind(this);
    this.animate = this.animate.bind(this);

    this.initScene();
    this.loadImageAndInitParticles();
  }

  initScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.fadeDone = true;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.initParticles();
      this.applyTargets();
      this.fadeDone = false;
      this.fadeElapsed = -1;
      this.forming = true;
    });

    if (!this.isMobile) window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
    window.addEventListener(PARTICLES_EXPLODE_EVENT, this.onExplodeEvent);
  }

  onExplodeEvent() {
    if (this.fadeElapsed >= 0) return;
    this.forming = false;
    this.fadeElapsed = 0;
  }

  applyTargets() {
    if (!this.targets || this.normalizedCoords.length === 0) return;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const random = this.normalizedCoords[Math.floor(Math.random() * this.normalizedCoords.length)];
      this.targets[i3]     = random.nx * HERO_SCALE;
      this.targets[i3 + 1] = random.ny * HERO_SCALE;
      this.targets[i3 + 2] = (Math.random() - 0.5) * 0.2;
    }
  }

  loadImageAndInitParticles() {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      const size = 256;
      offscreen.width = size;
      offscreen.height = size;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);
      const aspect = img.width / img.height;
      let drawW = size, drawH = size;
      if (aspect > 1) drawH = size / aspect;
      else drawW = size * aspect;
      const dx = (size - drawW) / 2;
      const dy = (size - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);

      const imageData = ctx.getImageData(0, 0, size, size);
      const sampled = [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const alpha = imageData.data[(y * size + x) * 4 + 3];
          if (alpha > 128) {
            const nx = (x / size) * 2 - 1;
            const ny = -(y / size) * 2 + 1;
            sampled.push({ nx, ny });
            if (nx < minX) minX = nx;
            if (nx > maxX) maxX = nx;
            if (ny < minY) minY = ny;
            if (ny > maxY) maxY = ny;
          }
        }
      }

      if (sampled.length > 0) {
        const cx = (maxX + minX) / 2;
        const cy = (maxY + minY) / 2;
        for (const c of sampled) { c.nx -= cx; c.ny -= cy; }
      }

      this.normalizedCoords = sampled;
      this.initParticles();
      this.applyTargets();
      this.animate();
    };
    img.src = this.imageUrl;
  }

  initParticles() {
    this.positions  = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.targets    = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.positions[i3]     = (Math.random() - 0.5) * 20;
      this.positions[i3 + 1] = (Math.random() - 0.5) * 20;
      this.positions[i3 + 2] = (Math.random() - 0.5) * 20;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      size: this.isMobile ? 0.028 : 0.012,
      color: this.color,
      transparent: true,
      opacity: this.baseOpacity,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  onMouseMove(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    this.raycaster.ray.intersectPlane(this.plane, this.mouse);
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateParticles(dt) {
    if (!this.positions || !this.targets) return;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const px = this.positions[i3];
      const py = this.positions[i3 + 1];
      const pz = this.positions[i3 + 2];

      const dx = this.mouse.x - px;
      const dy = this.mouse.y - py;
      const dz = this.mouse.z - pz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;

      const strength = this.forming ? 0.5 : -3.0;
      let fx = (dx / dist * strength) / dist;
      let fy = (dy / dist * strength) / dist;
      let fz = (dz / dist * strength) / dist;

      if (this.forming) {
        fx += (this.targets[i3]     - px) * 1.2;
        fy += (this.targets[i3 + 1] - py) * 1.2;
        fz += (this.targets[i3 + 2] - pz) * 1.2;
      }

      this.velocities[i3]     = (this.velocities[i3]     + fx * dt) * 0.85;
      this.velocities[i3 + 1] = (this.velocities[i3 + 1] + fy * dt) * 0.85;
      this.velocities[i3 + 2] = (this.velocities[i3 + 2] + fz * dt) * 0.85;

      this.positions[i3]     += this.velocities[i3];
      this.positions[i3 + 1] += this.velocities[i3 + 1];
      this.positions[i3 + 2] += this.velocities[i3 + 2];
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();

    if (this.points) this.updateParticles(dt);

    if (this.fadeElapsed >= 0 && !this.fadeDone && this.material) {
      this.fadeElapsed += dt;
      const t = Math.max(0, this.fadeElapsed - FADE_START_DELAY_S) / FADE_DURATION_S;
      const eased = 1 - Math.min(1, t) ** 2;
      this.material.opacity = this.baseOpacity * eased;
      if (t >= 1) {
        this.material.opacity = 0;
        this.fadeDone = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener(PARTICLES_EXPLODE_EVENT, this.onExplodeEvent);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}

export default function MagneticParticles({ imageUrl, color = 0xbe123c, particleCount }) {
  const containerRef = useRef(null);
  const systemRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      if (systemRef.current) { systemRef.current.destroy(); systemRef.current = null; }
      systemRef.current = new ParticleSystem(containerRef.current, imageUrl, color, particleCount);
    }, 50);

    const handlePageShow = (e) => {
      if (e.persisted && containerRef.current) {
        if (systemRef.current) systemRef.current.destroy();
        systemRef.current = new ParticleSystem(containerRef.current, imageUrl, color, particleCount);
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pageshow', handlePageShow);
      if (systemRef.current) { systemRef.current.destroy(); systemRef.current = null; }
    };
  }, [imageUrl, color, particleCount]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  );
}
