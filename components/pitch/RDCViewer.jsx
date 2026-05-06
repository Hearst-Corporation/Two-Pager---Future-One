'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const HOTSPOTS = [
  {
    id: 'south',
    label: 'South wing',
    title: 'South wing — B1',
    body: 'Curved curtain wall · 3 floors · Administration + research labs · QCRI / QEERI offices',
    pos: [0, 11, 32],
  },
  {
    id: 'north',
    label: 'North wing',
    title: 'North wing — B2',
    body: 'Mirror of south wing · Translational labs · QBRI · Vivarium link',
    pos: [0, 11, -32],
  },
  {
    id: 'spine',
    label: 'Central spine',
    title: 'Central spine',
    body: 'Limestone-clad transverse bar · Main entrance · Monumental hall · Conference rooms',
    pos: [0, 14, 0],
  },
  {
    id: 'utility',
    label: 'B3 utility',
    title: 'B3 — MEP utility',
    body: '4 300 m² · 11 transformers · MV room · Generators · N₂ tank · Loading bay',
    pos: [-50, 6, -45],
  },
];

const FACTS = [
  ['45 500', 'm² built-up'],
  ['95 000', 'm² plot size'],
  ['11', 'transformers'],
  ['420', 'parking'],
  ['700', 'staff (Ph.1)'],
  ['223 000', 'm² masterplan'],
];

export default function RDCViewer() {
  const mountRef = useRef(null);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [hotspotScreenPos, setHotspotScreenPos] = useState({});
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d0d);
    scene.fog = new THREE.Fog(0x0d0d0d, 140, 320);

    const getSize = () => ({
      w: mount.clientWidth,
      h: mount.clientHeight,
    });
    const { w: width, h: height } = getSize();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 600);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    /* ---------- Lighting (Doha sun) ---------- */
    const sun = new THREE.DirectionalLight(0xfff1d8, 1.7);
    sun.position.set(60, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 280;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const fill = new THREE.HemisphereLight(0xc4dcff, 0x3a2a18, 0.4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x8d1b3d, 0.25);
    rim.position.set(-40, 20, -50);
    scene.add(rim);

    /* ---------- Materials ---------- */
    const desertMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 1,
      metalness: 0,
    });
    const plotMat = new THREE.MeshStandardMaterial({
      color: 0xc9b896,
      roughness: 1,
      metalness: 0,
    });
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xddd2bc,
      roughness: 0.9,
      metalness: 0,
    });
    const limestoneMat = new THREE.MeshStandardMaterial({
      color: 0xe8dcc4,
      roughness: 0.85,
      metalness: 0.02,
    });
    const limestoneDarkMat = new THREE.MeshStandardMaterial({
      color: 0xc9b896,
      roughness: 0.85,
      metalness: 0.02,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a8d7a,
      roughness: 0.12,
      metalness: 0.5,
      transmission: 0.3,
      transparent: true,
      opacity: 0.85,
      reflectivity: 0.6,
      clearcoat: 0.5,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xeae3d8,
      roughness: 0.6,
      metalness: 0.15,
    });
    const utilityMat = new THREE.MeshStandardMaterial({
      color: 0x6a6358,
      roughness: 0.85,
      metalness: 0.1,
    });
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a3a,
      roughness: 0.95,
      metalness: 0,
    });

    /* ---------- Ground & plot ---------- */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      desertMat,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const plotW = 180;
    const plotD = 140;
    const plot = new THREE.Mesh(
      new THREE.PlaneGeometry(plotW, plotD),
      plotMat,
    );
    plot.rotation.x = -Math.PI / 2;
    plot.position.y = 0.02;
    plot.receiveShadow = true;
    scene.add(plot);

    // Plot border
    const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(plotW, plotD));
    const border = new THREE.LineSegments(
      borderGeo,
      new THREE.LineBasicMaterial({ color: 0x8d1b3d, transparent: true, opacity: 0.6 }),
    );
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.05;
    scene.add(border);

    /* ============================================================
       BUILDING GEOMETRY — DOUBLE ARC TYPOLOGY
       ------------------------------------------------------------
       Two curved wings (south + north) mirrored across the X-axis
       Connected by a transverse limestone spine on the Y-axis
       The wings are hollow arcs: outer curve + inner straight edge
       =========================================================== */

    const buildings = [];

    /**
     * Build one curved wing as a series of short prismatic segments.
     * The wing follows an arc whose CENTER is on the inner side
     * (toward the spine), so the convex side faces outward.
     *
     * Wing footprint reference:
     *   - length along arc ≈ 70 m
     *   - width (radial)   = 13 m
     *   - height           = 12 m (R+2)
     *
     * @param {number} zSign  +1 for south wing, -1 for north wing
     */
    function makeWing(zSign) {
      const group = new THREE.Group();
      group.userData.id = zSign > 0 ? 'south' : 'north';

      const wingH = 12;
      const wingW = 13; // radial thickness
      const arcRadius = 110; // big radius → gentle curve, like real photos
      const arcSpan = Math.PI * 0.36; // ~65° (longer arc, gentle)
      const segments = 18;
      const segLen = (arcRadius * arcSpan) / segments;

      // For each wing we use a LOCAL coord system where the arc center is at origin
      // and the arc opens upward (+z local). After building, we rotate+translate
      // the whole group so the wing sits on the correct side of the spine.
      //
      // Local: center at (0,0), arc midpoint at (0, +arcRadius)
      // We want the wing's INNER edge ~25m from spine axis after placement.
      const innerEdgeDistFromSpine = 25; // m from spine center to inner wall

      // Build segments — each is a small box rotated to follow the arc
      const innerR = arcRadius - wingW;
      const outerR = arcRadius;

      // Local building space: arc center at origin, midpoint at (0, +arcRadius)
      // We'll build everything in local Z+ direction, then translate group at end.
      const rMid = (innerR + outerR) / 2;

      // Limestone segments along the arc
      for (let i = 0; i < segments; i++) {
        const aMid = -arcSpan / 2 + ((i + 0.5) / segments) * arcSpan;
        const px = Math.sin(aMid) * rMid;
        const pz = Math.cos(aMid) * rMid;

        const block = new THREE.Mesh(
          new THREE.BoxGeometry(segLen + 0.4, wingH, wingW),
          limestoneMat,
        );
        block.position.set(px, wingH / 2, pz);
        block.rotation.y = -aMid;
        block.castShadow = true;
        block.receiveShadow = true;
        group.add(block);

        // Outer face = +z in local block space (toward arc convex side = away from center)
        // After rotation, outer face points radially outward
        const outerLocalZ = wingW / 2 + 0.05;
        for (let floor = 0; floor < 3; floor++) {
          const bandH = 2.6;
          const yBand = 1.5 + floor * 3.3;
          const band = new THREE.Mesh(
            new THREE.BoxGeometry(segLen + 0.3, bandH, 0.18),
            glassMat,
          );
          band.position.set(0, yBand - wingH / 2, outerLocalZ);
          block.add(band);
        }

        // Punched windows on inner face (toward courtyard / arc center)
        for (let floor = 0; floor < 3; floor++) {
          for (let wx = -segLen / 2 + 0.8; wx < segLen / 2 - 0.8; wx += 1.6) {
            const win = new THREE.Mesh(
              new THREE.BoxGeometry(0.9, 1.1, 0.05),
              new THREE.MeshStandardMaterial({
                color: 0x1a2a30,
                roughness: 0.4,
                metalness: 0.5,
                emissive: 0x101820,
                emissiveIntensity: 0.15,
              }),
            );
            win.position.set(wx, -wingH / 2 + 2 + floor * 3.3, -wingW / 2 - 0.03);
            block.add(win);
          }
        }
      }

      // Cantilever canopy — extends outward from outer wall
      const canopyOvershoot = 5;
      for (let i = 0; i < segments; i++) {
        const aMid = -arcSpan / 2 + ((i + 0.5) / segments) * arcSpan;
        const rCan = rMid + canopyOvershoot / 2;
        const cx = Math.sin(aMid) * rCan;
        const cz = Math.cos(aMid) * rCan;

        const canopy = new THREE.Mesh(
          new THREE.BoxGeometry(segLen + 0.4, 0.5, wingW + canopyOvershoot),
          roofMat,
        );
        canopy.position.set(cx, wingH + 0.25, cz);
        canopy.rotation.y = -aMid;
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        group.add(canopy);
      }

      // Canopy support columns along outer edge
      const colMat = new THREE.MeshStandardMaterial({
        color: 0xeae3d8,
        roughness: 0.5,
        metalness: 0.3,
      });
      const numCols = 8;
      for (let i = 0; i <= numCols; i++) {
        const a = -arcSpan / 2 + (i / numCols) * arcSpan;
        const rCol = outerR + canopyOvershoot - 0.5;
        const x = Math.sin(a) * rCol;
        const z = Math.cos(a) * rCol;
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, wingH, 12),
          colMat,
        );
        col.position.set(x, wingH / 2, z);
        col.castShadow = true;
        group.add(col);
      }

      // Now place the wing group:
      // - Local origin = arc center
      // - Local arc midpoint at (0, +arcRadius)
      // - Wing inner edge (closest to spine) at z = innerR after build
      // - We want this inner edge to sit at world z = +innerEdgeDistFromSpine for south wing
      //   ⇒ shift group by (0, 0, +innerEdgeDistFromSpine - innerR) for south
      //   For north wing, mirror across spine (z=0)

      if (zSign > 0) {
        // South wing: place arc center far in -z, so arc opens to +z
        group.position.z = innerEdgeDistFromSpine - innerR;
      } else {
        // North wing: mirror across spine
        group.scale.z = -1;
        group.position.z = -(innerEdgeDistFromSpine - innerR);
      }

      scene.add(group);
      buildings.push(group);
      return group;
    }

    makeWing(+1);
    makeWing(-1);

    /* ---------- Central spine (limestone bar) ---------- */
    const spineGroup = new THREE.Group();
    spineGroup.userData.id = 'spine';

    const spineW = 60; // east-west span (along x)
    const spineD = 14; // north-south depth (along z)
    const spineH = 12.5;

    // Main mass
    const spineMain = new THREE.Mesh(
      new THREE.BoxGeometry(spineW, spineH, spineD),
      limestoneDarkMat,
    );
    spineMain.position.y = spineH / 2;
    spineMain.castShadow = true;
    spineMain.receiveShadow = true;
    spineGroup.add(spineMain);

    // Glass curtain wall band on the LONG façades (north + south of spine block)
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a30,
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x101820,
      emissiveIntensity: 0.2,
    });
    for (let side of [-1, 1]) {
      // Glass band horizontal mid-floor (acts as curtain wall on long N/S faces)
      const glassBand = new THREE.Mesh(
        new THREE.BoxGeometry(spineW * 0.55, spineH * 0.5, 0.2),
        glassMat,
      );
      glassBand.position.set(0, spineH * 0.5, side * (spineD / 2 + 0.05));
      spineGroup.add(glassBand);

      // Punched windows on limestone surrounding the glass band
      for (let x = -spineW / 2 + 2; x <= spineW / 2 - 2; x += 2.2) {
        if (Math.abs(x) < spineW * 0.28) continue; // skip area covered by glass band
        for (let y = 2; y < spineH - 1; y += 2.5) {
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 1.2, 0.05),
            windowMat,
          );
          win.position.set(x, y, side * (spineD / 2 + 0.03));
          spineGroup.add(win);
        }
      }
    }

    // East entrance: cantilever angled canopy (signature from misty photo)
    const entryCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.5, spineD + 6),
      roofMat,
    );
    entryCanopy.position.set(spineW / 2 + 7, spineH - 0.4, 0);
    entryCanopy.rotation.z = -0.08;
    entryCanopy.castShadow = true;
    spineGroup.add(entryCanopy);

    // Canopy support column
    const entryCol = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, spineH - 0.5, 16),
      roofMat,
    );
    entryCol.position.set(spineW / 2 + 13, (spineH - 0.5) / 2, 0);
    entryCol.castShadow = true;
    spineGroup.add(entryCol);

    scene.add(spineGroup);
    buildings.push(spineGroup);

    /* ---------- Inner courtyards (between wings & spine) ---------- */
    // South courtyard: between spine (z≈±spineD/2) and south wing inner edge (z=+25)
    // North courtyard: mirror
    const courtyardW = 50;
    const courtyardD = 18; // gap between spine and wing
    for (let zSign of [+1, -1]) {
      const cyZ = zSign * 16; // midway between spine end (~30) and wing edge (~25)
      const cy = new THREE.Mesh(
        new THREE.PlaneGeometry(courtyardW, courtyardD),
        plazaMat,
      );
      cy.rotation.x = -Math.PI / 2;
      cy.position.set(0, 0.04, cyZ);
      cy.receiveShadow = true;
      scene.add(cy);

      // Grass strip
      const grass = new THREE.Mesh(
        new THREE.PlaneGeometry(courtyardW * 0.7, courtyardD * 0.4),
        grassMat,
      );
      grass.rotation.x = -Math.PI / 2;
      grass.position.set(0, 0.06, cyZ);
      grass.receiveShadow = true;
      scene.add(grass);

      // Tree rows in courtyards
      addTreeRow(0, cyZ, courtyardW * 0.7, 7);
    }

    /* ---------- B3 Utility (retreat north-west) ---------- */
    const utilGroup = new THREE.Group();
    utilGroup.userData.id = 'utility';
    utilGroup.position.set(-50, 0, -45);

    const utilW = 26;
    const utilD = 14;
    const utilH = 7;
    const util = new THREE.Mesh(
      new THREE.BoxGeometry(utilW, utilH, utilD),
      utilityMat,
    );
    util.position.y = utilH / 2;
    util.castShadow = true;
    util.receiveShadow = true;
    utilGroup.add(util);

    // Transformer pads (visualize the 11 transformers)
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.4,
    });
    for (let i = 0; i < 11; i++) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4), padMat);
      const row = Math.floor(i / 6);
      const col = i % 6;
      pad.position.set(-utilW / 2 + 1.5 + col * 2.2, 0.8, utilD / 2 + 1.8 + row * 2);
      pad.castShadow = true;
      utilGroup.add(pad);
    }

    // Stack
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 4, 12),
      utilityMat,
    );
    stack.position.set(utilW / 2 - 1, utilH + 2, 0);
    stack.castShadow = true;
    utilGroup.add(stack);

    scene.add(utilGroup);
    buildings.push(utilGroup);

    /* ---------- Trees (Education City landscaping) ---------- */
    function addTreeRow(cx, cz, len, count) {
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3a2618,
        roughness: 1,
      });
      const foliageMat2 = new THREE.MeshStandardMaterial({
        color: 0x2d4a2d,
        roughness: 0.9,
      });
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1) - 0.5;
        const x = cx + t * len;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.18, 1.4, 6),
          trunkMat,
        );
        trunk.position.set(x, 0.7, cz);
        trunk.castShadow = true;
        scene.add(trunk);
        const foliage = new THREE.Mesh(
          new THREE.SphereGeometry(0.9, 8, 6),
          foliageMat2,
        );
        foliage.position.set(x, 1.8, cz);
        foliage.castShadow = true;
        scene.add(foliage);
      }
    }

    // Perimeter trees
    const perimeterTrees = [
      [-55, 38], [55, 38], [-55, -38], [55, -38],
      [-58, 0], [58, 0], [-50, 20], [50, 20],
      [-50, -20], [50, -20], [-30, 45], [30, 45],
      [-30, -45], [30, -45],
    ];
    perimeterTrees.forEach(([x, z]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 1.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 1 }),
      );
      trunk.position.set(x, 0.8, z);
      trunk.castShadow = true;
      scene.add(trunk);
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x2d4a2d, roughness: 0.9 }),
      );
      foliage.position.set(x, 2.2, z);
      foliage.castShadow = true;
      scene.add(foliage);
    });

    /* ---------- Parking grid (420 spots, abstracted) ---------- */
    const parkMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
    });
    const parkLot = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 14),
      parkMat,
    );
    parkLot.rotation.x = -Math.PI / 2;
    parkLot.position.set(40, 0.05, -38);
    parkLot.receiveShadow = true;
    scene.add(parkLot);

    const carMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.5,
      metalness: 0.3,
    });
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 18; c++) {
        const car = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.5, 0.8),
          carMat,
        );
        car.position.set(22 + c * 2, 0.3, -41 + r * 1.4);
        car.castShadow = true;
        scene.add(car);
      }
    }

    /* ---------- Camera controls (orbit-style, manual) ---------- */
    const ctrl = {
      azimuth: Math.PI / 4,
      polar: Math.PI / 3.2,
      radius: 130,
      target: new THREE.Vector3(0, 6, 0),
      isDragging: false,
      lastX: 0,
      lastY: 0,
      autoRotate: true,
    };
    const updateCamera = () => {
      const x = ctrl.target.x + ctrl.radius * Math.sin(ctrl.polar) * Math.cos(ctrl.azimuth);
      const y = ctrl.target.y + ctrl.radius * Math.cos(ctrl.polar);
      const z = ctrl.target.z + ctrl.radius * Math.sin(ctrl.polar) * Math.sin(ctrl.azimuth);
      camera.position.set(x, y, z);
      camera.lookAt(ctrl.target);
    };
    updateCamera();

    const onDown = (e) => {
      ctrl.isDragging = true;
      ctrl.autoRotate = false;
      ctrl.lastX = e.clientX;
      ctrl.lastY = e.clientY;
    };
    const onMove = (e) => {
      if (!ctrl.isDragging) return;
      const dx = e.clientX - ctrl.lastX;
      const dy = e.clientY - ctrl.lastY;
      ctrl.azimuth -= dx * 0.005;
      ctrl.polar = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, ctrl.polar - dy * 0.005));
      ctrl.lastX = e.clientX;
      ctrl.lastY = e.clientY;
      updateCamera();
    };
    const onUp = () => {
      ctrl.isDragging = false;
    };
    const onWheelLocal = (e) => {
      e.preventDefault();
      e.stopPropagation();
      ctrl.radius = Math.max(60, Math.min(220, ctrl.radius + e.deltaY * 0.1));
      updateCamera();
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dom.addEventListener('wheel', onWheelLocal, { passive: false });

    /* ---------- Hotspot screen-space projection ---------- */
    const projectHotspots = () => {
      const { w: vw, h: vh } = getSize();
      const out = {};
      const v = new THREE.Vector3();
      HOTSPOTS.forEach((spot) => {
        v.set(spot.pos[0], spot.pos[1], spot.pos[2]);
        v.project(camera);
        const sx = (v.x * 0.5 + 0.5) * vw;
        const sy = (-v.y * 0.5 + 0.5) * vh;
        const visible = v.z < 1;
        out[spot.id] = { x: sx, y: sy, visible };
      });
      setHotspotScreenPos(out);
    };

    /* ---------- Animation loop ---------- */
    let frame;
    const animate = () => {
      if (ctrl.autoRotate) {
        ctrl.azimuth += 0.0012;
        updateCamera();
      }
      projectHotspots();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    /* ---------- Resize ---------- */
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    stateRef.current = { ctrl, updateCamera };

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('wheel', onWheelLocal);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    };
  }, []);

  const resumeAuto = () => {
    if (stateRef.current.ctrl) stateRef.current.ctrl.autoRotate = true;
  };

  return (
    <div style={S.wrap}>
      <div ref={mountRef} style={S.canvas} />

      {/* Hotspots */}
      {HOTSPOTS.map((h) => {
        const p = hotspotScreenPos[h.id];
        if (!p || !p.visible) return null;
        const isActive = activeHotspot === h.id;
        return (
          <div
            key={h.id}
            style={{
              ...S.hotspot,
              left: p.x,
              top: p.y,
              zIndex: isActive ? 20 : 10,
            }}
          >
            <button
              style={{ ...S.dot, ...(isActive ? S.dotActive : null) }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveHotspot(isActive ? null : h.id);
              }}
              aria-label={h.label}
            />
            {isActive && (
              <div style={S.tooltip}>
                <div style={S.tooltipTitle}>{h.title}</div>
                <div style={S.tooltipBody}>{h.body}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Top-left fact panel */}
      <div style={S.factPanel}>
        <div style={S.factHeader}>QF — RESEARCH & DEVELOPMENT COMPLEX</div>
        <div style={S.factSub}>
          Education City · Doha · Phase 1A · Perkins+Will (2013–2016)
        </div>
        <div style={S.factGrid}>
          {FACTS.map(([n, l]) => (
            <div key={l} style={S.factCell}>
              <div style={S.factNum}>{n}</div>
              <div style={S.factLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-right legend */}
      <div style={S.legend}>
        <div style={S.legendRow}>
          <span style={{ ...S.swatch, background: '#e8dcc4' }} />
          Limestone cladding
        </div>
        <div style={S.legendRow}>
          <span style={{ ...S.swatch, background: '#3a8d7a' }} />
          Curved curtain wall (turquoise glass)
        </div>
        <div style={S.legendRow}>
          <span style={{ ...S.swatch, background: '#eae3d8' }} />
          Cantilever canopy roof
        </div>
        <div style={S.legendRow}>
          <span style={{ ...S.swatch, background: '#6a6358' }} />
          B3 — MEP utility hub
        </div>
      </div>

      {/* Hint */}
      <div style={S.hint} onClick={resumeAuto}>
        Drag to orbit · scroll to zoom · click points
      </div>

      {/* Credits */}
      <div style={S.credits}>
        Geometry calibrated from Redco aerial imagery · Perkins+Will architect · Integral Group MEP · Redco Al Mana D&B · QAR 1.5 Bn
      </div>
    </div>
  );
}

const S = {
  wrap: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    background: '#0d0d0d',
    cursor: 'grab',
  },
  canvas: { position: 'absolute', inset: 0 },
  hotspot: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'auto',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid #fff',
    background: 'var(--color-accent-strong)',
    cursor: 'pointer',
    padding: 0,
    boxShadow: '0 0 0 4px rgba(141,27,61,0.25), 0 2px 8px rgba(0,0,0,0.5)',
    transition: 'transform 0.2s ease',
  },
  dotActive: {
    transform: 'scale(1.4)',
    background: '#fff',
  },
  tooltip: {
    position: 'absolute',
    left: 22,
    top: -8,
    minWidth: 240,
    padding: '12px 14px',
    background: 'rgba(15,15,15,0.95)',
    border: '1px solid var(--color-accent-strong)',
    borderRadius: 4,
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#fff',
    marginBottom: 4,
  },
  tooltipBody: {
    fontSize: 11,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },
  factPanel: {
    position: 'absolute',
    top: 32,
    left: 32,
    padding: '20px 24px',
    background: 'rgba(15,15,15,0.7)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 4,
    pointerEvents: 'none',
    maxWidth: 380,
  },
  factHeader: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-accent-strong)',
    marginBottom: 4,
  },
  factSub: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  factGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px 18px',
  },
  factCell: {},
  factNum: {
    fontSize: 18,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: -0.5,
    fontVariantNumeric: 'tabular-nums',
  },
  factLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  legend: {
    position: 'absolute',
    bottom: 96,
    right: 32,
    padding: '14px 18px',
    background: 'rgba(15,15,15,0.7)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 4,
    pointerEvents: 'none',
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.75)',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '3px 0',
  },
  swatch: {
    width: 12,
    height: 12,
    display: 'inline-block',
    borderRadius: 2,
  },
  hint: {
    position: 'absolute',
    top: 32,
    right: 32,
    padding: '8px 14px',
    background: 'rgba(15,15,15,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  credits: {
    position: 'absolute',
    bottom: 96,
    left: 32,
    fontSize: 9,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.45)',
    pointerEvents: 'none',
    maxWidth: 380,
  },
};
