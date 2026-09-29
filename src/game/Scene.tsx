import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import StreetLamp from "./StreetLamp";
import Garage from "./Garage";
import VendingMachine from "./VendingMachine";
import GroundRitual from "./GroundRitual";
import Cat from "./Cat";
import { Girls } from "./Characters";
import {
  BrickWall,
  CardboardBoxes,
  CityBackdrop,
  Cone,
  Dumpster,
  Ground,
  Hydrant,
  Manhole,
  NeighborBuilding,
  Posters,
  Puddles,
  Sidewalk,
  Tire,
  Trash,
  UtilityPole,
} from "./Environment";
import { TagsLayer } from "./Graffiti";
import { Puff } from "./Particles";
import { justStarted, revealReady, useGame } from "./store";
import { GIRLS, sceneJustEnded } from "./dialogue";
import { audio } from "./audio";
import { CURB_H, FRONT_Z } from "./world";

/** wide establishing shot before you "arrive" */
const INTRO = { radius: 10.5, polar: 1.3, az: 0.32, ty: 1.9 };

function CameraRig() {
  const { camera, gl, size } = useThree();
  const state = useRef({
    azimuth: 0,
    polar: 1.39,
    radius: 4.1,
    tAz: 0,
    tPolar: 1.39,
    tRadius: 4.1,
    radiusScale: 1,
    dragging: false,
    px: 0,
    py: 0,
  });
  const target = useRef(new THREE.Vector3(0, 1.05, 0.9));
  const focus = useRef(0);
  /** 0 = establishing shot, 1 = arrived */
  const arrive = useRef(0);

  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;
    const down = (e: PointerEvent) => {
      if (!useGame.getState().started) {
        useGame.getState().start();
        return;
      }
      s.dragging = true;
      s.px = e.clientX;
      s.py = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.tAz = THREE.MathUtils.clamp(s.tAz - (e.clientX - s.px) * 0.004, -0.75, 0.75);
      s.tPolar = THREE.MathUtils.clamp(s.tPolar - (e.clientY - s.py) * 0.003, 1.16, 1.5);
      s.px = e.clientX;
      s.py = e.clientY;
    };
    const up = () => (s.dragging = false);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!useGame.getState().started) {
        useGame.getState().start();
        return;
      }
      if (justStarted()) return;
      s.tRadius = THREE.MathUtils.clamp(s.tRadius + e.deltaY * 0.004, 3.0, 9.5);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = Math.max(0.4, size.width / Math.max(1, size.height));
    cam.fov = THREE.MathUtils.clamp(50 + Math.max(0, 1.7 - aspect) * 16, 50, 76);
    state.current.radiusScale = THREE.MathUtils.clamp(1.7 / aspect, 1, 1.65);
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((st, dt) => {
    const s = state.current;
    const { started, phase } = useGame.getState();
    s.azimuth = THREE.MathUtils.damp(s.azimuth, s.tAz, 6, dt);
    s.polar = THREE.MathUtils.damp(s.polar, s.tPolar, 6, dt);
    s.radius = THREE.MathUtils.damp(s.radius, s.tRadius, 5, dt);

    // slow cinematic dolly-in once you scroll / press enter
    arrive.current = THREE.MathUtils.damp(arrive.current, started ? 1 : 0, 1.1, dt);
    const k = THREE.MathUtils.smootherstep(arrive.current, 0, 1);

    // lean in when you're talking / reading with them
    const wantFocus = phase === "talk" || phase === "spread" || phase === "reading" || phase === "shuffle" ? 1 : 0;
    focus.current = THREE.MathUtils.damp(focus.current, wantFocus, 2.5, dt);

    const t = st.clock.elapsedTime;
    const sway = Math.sin(t * 0.23) * 0.035;
    const near = s.radius * s.radiusScale - focus.current * 0.9;
    const radius = THREE.MathUtils.lerp(INTRO.radius * s.radiusScale, near, k);
    const introAz = INTRO.az + Math.sin(t * 0.08) * 0.08;
    const az = THREE.MathUtils.lerp(introAz, s.azimuth, k) + sway;
    const pol = THREE.MathUtils.lerp(INTRO.polar, s.polar, k) + Math.sin(t * 0.31) * 0.012;
    const tx = 0;
    const ty = THREE.MathUtils.lerp(INTRO.ty, 1.05 - focus.current * 0.12, k);
    const tz = 0.9 - focus.current * 0.35 * k;
    target.current.set(tx, ty, tz);
    camera.position.set(
      tx + radius * Math.sin(pol) * Math.sin(az),
      ty + radius * Math.cos(pol),
      tz + radius * Math.sin(pol) * Math.cos(az)
    );
    camera.lookAt(tx + Math.sin(t * 0.2) * 0.05, ty, tz);
  });
  return null;
}

function WorldClock() {
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current > 1.2) {
      useGame.getState().tick(1);
      acc.current = 0;
    }
  });
  return null;
}

/** drives the girls' ambient chatter + their voices */
function Chatter() {
  const acc = useRef(2.5);
  const gap = useRef(4.8);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < gap.current) return;
    acc.current = 0;
    const g = useGame.getState();
    if (g.phase !== "ambient" && g.phase !== "after") return;
    if (!g.nextAmbient()) return; // frozen on a question, or nothing new to say
    const line = useGame.getState().line;
    // natural pacing: longer lines hold longer, with a little random breath
    gap.current = THREE.MathUtils.clamp(2.2 + line.text.length * 0.045, 3.2, 6.5) + Math.random() * 1.2;
    // a comfortable lull between topics
    if (sceneJustEnded()) gap.current += 3 + Math.random() * 3;
    if (g.started) audio.say(GIRLS[line.who].pitch, line.text.length / 6);
  });
  return null;
}

function Interactions() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      const g = useGame.getState();
      if (k === "m") {
        g.toggleMute();
        return;
      }
      if (k === " " || k === "e" || k === "enter") {
        e.preventDefault();
        if (!g.started) {
          g.start();
          return;
        }
        if (justStarted()) return;
        if (g.phase === "ambient" || g.phase === "after") g.join();
        else if (g.phase === "talk") {
          if (g.talkStep === 3 && !g.topic) return; // must pick a topic
          g.advanceTalk();
        } else if (g.phase === "reading") {
          // each card gets its beat — mashing E/space can't run through the spread
          if (revealReady()) g.nextReveal();
        }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Girls />
      <Cat />
      <GroundRitual />
    </>
  );
}

export default function Scene() {
  return (
    <>
      <color attach="background" args={["#06060f"]} />
      <fogExp2 attach="fog" args={["#0a0a18", 0.05]} />
      <CameraRig />
      <WorldClock />
      <Chatter />
      <Interactions />

      {/* base fill – city light pollution */}
      <ambientLight color="#2a2e4e" intensity={0.5} />
      <hemisphereLight color="#252a4a" groundColor="#0a0906" intensity={0.35} />
      <directionalLight color="#6a6aa8" intensity={0.42} position={[-6, 9, -8]} />

      <Ground />
      <Sidewalk />
      <BrickWall />
      <Garage />
      <NeighborBuilding />
      <StreetLamp />

      {/* glowing drink machine against the garage wall, behind cole */}
      <VendingMachine position={[1.75, CURB_H, FRONT_Z + 0.38]} />

      <Dumpster position={[4.2, CURB_H, -2.42]} rotation={0.1} />
      <CardboardBoxes position={[-0.35, CURB_H, -2.45]} />
      <Hydrant position={[2.85, CURB_H, -2.2]} />
      <Cone position={[2.9, 0, 2.0]} />
      <Tire position={[-3.2, 0, 0.6]} />
      <Manhole position={[-2.4, 0, 2.6]} />
      <Puff position={[-2.4, 0.1, 2.6]} count={6} rise={2.4} opacity={0.07} />
      <Puddles />
      <Trash />
      <UtilityPole position={[6.4, 0, -2.6]} />
      <Posters />
      <TagsLayer />
      <CityBackdrop />
    </>
  );
}
