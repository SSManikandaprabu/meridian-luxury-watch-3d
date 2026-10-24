import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  BASE_WATCH_PRICE,
  CalloutPartId,
  DialColorId,
  STRAP_SPECS,
  StrapTypeId,
} from './types/watch';
import { WatchPoseState } from './components/watch/MeridianWatch';
import { CameraTargetState, StudioScene } from './components/watch/StudioScene';
import { LuxuryLoader } from './components/ui/LuxuryLoader';
import { Navbar } from './components/ui/Navbar';
import { FloatingAtelierDock } from './components/ui/FloatingAtelierDock';
import { ScrollStorySections } from './components/sections/ScrollStorySections';
import { escapementAudio } from './utils/mechanicalTickAudio';

gsap.registerPlugin(ScrollTrigger);

export const App: React.FC = () => {
  const [dialColor, setDialColor] = useState<DialColorId>('glacier');
  const [strapType, setStrapType] = useState<StrapTypeId>('leather');
  const [activeCallout, setActiveCallout] = useState<CalloutPartId>(null);
  const [showCalloutPins, setShowCalloutPins] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [sceneReady, setSceneReady] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeChapter, setActiveChapter] = useState<number>(0);

  // Inspect query parameters for isolated build verification stages (Step 2 & Step 3)
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const stageMode = searchParams.get('stage'); // 'isolation' | 'postfx' | null

  // Shared mutable refs for 60fps Three.js interpolation
  const poseRef = useRef<WatchPoseState>({
    rotationX: 0.16,
    rotationY: -0.32,
    rotationZ: 0.06,
    positionX: stageMode ? 0 : 1.75,
    positionY: 0.05,
    positionZ: 0,
    scale: 1.0,
    lumeBoost: 0.0,
  });

  const cameraRef = useRef<CameraTargetState>({
    camX: 0,
    camY: 0.06,
    camZ: stageMode === 'isolation' ? 8.8 : stageMode === 'postfx' ? 7.6 : 8.9,
    lookX: 0,
    lookY: 0,
    lookZ: 0,
    focusDistance: 0.012,
    bokehScale: 0.75,
  });

  // Detect viewport size & prefers-reduced-motion
  useEffect(() => {
    const checkViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!stageMode && window.scrollY < 50) {
        poseRef.current.positionX = mobile ? 0 : 1.75;
        cameraRef.current.camZ = mobile ? 9.6 : 8.9;
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', checkViewport);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [stageMode]);

  // Theme class synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Mechanical escapement sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      escapementAudio.start();
    } else {
      escapementAudio.stop();
    }
  };

  useEffect(() => {
    return () => escapementAudio.stop();
  }, []);

  // Camera focus assist when user clicks a specific part callout
  const handleSelectCallout = (part: CalloutPartId) => {
    setActiveCallout(part);
    if (!part) return;
    if (part === 'crown') {
      poseRef.current.rotationY = -0.62;
      poseRef.current.rotationX = 0.12;
    } else if (part === 'crystal') {
      poseRef.current.rotationY = 0.35;
      poseRef.current.rotationX = -0.32;
    } else if (part === 'date') {
      poseRef.current.rotationY = -0.25;
      poseRef.current.rotationX = 0.05;
    } else if (part === 'lugs') {
      poseRef.current.rotationY = 0.48;
      poseRef.current.rotationX = 0.38;
    }
  };

  // Lenis Smooth Scroll + GSAP ScrollTrigger Choreography
  useEffect(() => {
    if (stageMode) return;

    const lenis = new Lenis({
      duration: reducedMotion ? 0 : 1.15,
      smoothWheel: !reducedMotion,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    const mobile = window.innerWidth < 768;
    const xRight = mobile ? 0 : 1.78;
    const xLeft = mobile ? 0 : -1.48;

    // Hero Entry Rise Animation
    if (!reducedMotion) {
      gsap.fromTo(
        poseRef.current,
        {
          positionY: -1.35,
          rotationX: 0.55,
          rotationY: -0.75,
        },
        {
          positionY: 0.05,
          rotationX: 0.16,
          rotationY: -0.32,
          duration: 1.9,
          ease: 'power3.out',
        }
      );
    }

    // Master Scroll Choreography across the 7 chapters
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: 'main',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.85,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          const chapterIdx = Math.min(6, Math.floor(self.progress * 7));
          setActiveChapter(chapterIdx);
        },
      },
    });

    // Transition 1 -> 2: Dial Macro (Push tight into sunburst dial & indices)
    masterTl
      .to(
        poseRef.current,
        {
          positionX: xLeft * 0.72,
          positionY: -0.08,
          rotationX: -0.16,
          rotationY: 0.24,
          rotationZ: -0.06,
          scale: 1.08,
          lumeBoost: 1.0,
          duration: 1,
          ease: 'power2.inOut',
        },
        0
      )
      .to(
        cameraRef.current,
        {
          camX: -0.22,
          camY: 0.08,
          camZ: mobile ? 5.6 : 4.75,
          lookX: -0.18,
          lookY: 0.04,
          duration: 1,
          ease: 'power2.inOut',
        },
        0
      )
      // Transition 2 -> 3: Exhibition Movement (180° horological turnover to Calibre M-01)
      .to(
        poseRef.current,
        {
          positionX: xRight * 0.78,
          positionY: 0.04,
          rotationX: 0.16,
          rotationY: Math.PI - 0.26,
          rotationZ: 0.05,
          scale: 1.04,
          lumeBoost: 0.1,
          duration: 1.1,
          ease: 'power2.inOut',
        },
        1
      )
      .to(
        cameraRef.current,
        {
          camX: 0.18,
          camY: 0.0,
          camZ: mobile ? 6.2 : 5.35,
          lookX: 0.18,
          lookY: 0,
          duration: 1.1,
          ease: 'power2.inOut',
        },
        1
      )
      // Transition 3 -> 4: Case & Bezel Grazing Profile (316L Satin & Sapphire Dome)
      .to(
        poseRef.current,
        {
          positionX: xLeft * 0.78,
          positionY: 0.05,
          rotationX: 0.44,
          rotationY: -0.76,
          rotationZ: -0.16,
          scale: 1.04,
          lumeBoost: 0.25,
          duration: 1,
          ease: 'power2.inOut',
        },
        2.1
      )
      .to(
        cameraRef.current,
        {
          camX: -0.18,
          camY: 0.06,
          camZ: mobile ? 6.4 : 5.55,
          lookX: -0.18,
          lookY: 0.02,
          duration: 1,
          ease: 'power2.inOut',
        },
        2.1
      )
      // Transition 4 -> 5: Straps Pullback (Full watch + straps framing)
      .to(
        poseRef.current,
        {
          positionX: xRight * 0.95,
          positionY: 0.06,
          rotationX: 0.14,
          rotationY: -0.28,
          rotationZ: 0.04,
          scale: 0.94,
          lumeBoost: 0.15,
          duration: 1,
          ease: 'power2.inOut',
        },
        3.1
      )
      .to(
        cameraRef.current,
        {
          camX: 0,
          camY: 0,
          camZ: mobile ? 10.2 : 9.2,
          lookX: 0,
          lookY: 0,
          duration: 1,
          ease: 'power2.inOut',
        },
        3.1
      )
      // Transition 5 -> 6: Collection Showcase
      .to(
        poseRef.current,
        {
          positionX: 0,
          positionY: mobile ? 0.95 : 1.15,
          rotationX: 0.22,
          rotationY: 0.18,
          rotationZ: -0.05,
          scale: 0.85,
          duration: 1,
          ease: 'power2.inOut',
        },
        4.1
      )
      .to(
        cameraRef.current,
        {
          camX: 0,
          camY: 0.1,
          camZ: mobile ? 10.4 : 9.4,
          lookX: 0,
          lookY: 0.1,
          duration: 1,
          ease: 'power2.inOut',
        },
        4.1
      )
      // Transition 6 -> 7: Private Viewing Salon Poise
      .to(
        poseRef.current,
        {
          positionX: xLeft * 1.05,
          positionY: 0.08,
          rotationX: 0.16,
          rotationY: 0.36,
          rotationZ: -0.06,
          scale: 0.98,
          lumeBoost: 0.35,
          duration: 1,
          ease: 'power2.inOut',
        },
        5.1
      )
      .to(
        cameraRef.current,
        {
          camX: 0,
          camY: 0.04,
          camZ: mobile ? 9.5 : 8.4,
          lookX: 0,
          lookY: 0,
          duration: 1,
          ease: 'power2.inOut',
        },
        5.1
      );

    return () => {
      masterTl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [reducedMotion, stageMode]);

  const handleJumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  const totalPrice = BASE_WATCH_PRICE + STRAP_SPECS[strapType].priceDelta;
  const formattedPrice = `$${totalPrice.toLocaleString('en-US')}`;

  // Isolated verification mode for Step 2 & Step 3 screenshots
  if (stageMode === 'isolation' || stageMode === 'postfx') {
    const isPostFx = stageMode === 'postfx';
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#050A12] via-[#0B1522] to-[#08101B]">
        <StudioScene
          dialColor={dialColor}
          strapType={strapType}
          activeCallout={activeCallout}
          onSelectCallout={setActiveCallout}
          poseRef={poseRef}
          cameraRef={cameraRef}
          isPaused={false}
          showCalloutPins={isPostFx}
          reducedMotion={false}
          isMobile={false}
          enablePostProcessing={isPostFx}
          enableStudioEnv={true}
          onReady={() => setSceneReady(true)}
        />
        <div className="fixed top-6 left-8 z-20 pointer-events-none">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#D8C3A0]">
            MERIDIAN HOROLOGICAL LAB ·{' '}
            {isPostFx
              ? 'STAGE 03: STUDIO HDRI + ACES POST-PROCESSING'
              : 'STAGE 02: 3D CAD GEOMETRY IN ISOLATION'}
          </p>
          <h1 className="font-serif text-3xl text-[#F2EEE6] mt-1">
            Calibre M-01 · 316L Surgical Steel
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen transition-colors duration-700 ${
        theme === 'light'
          ? 'bg-gradient-to-b from-[#F2EEE6] via-[#EAE3D5] to-[#E2DAC9] text-[#0B1522]'
          : 'bg-gradient-to-b from-[#04080F] via-[#0B1522] to-[#070E18] text-[#F2EEE6]'
      }`}
    >
      {/* Initial Progress Ring Loader */}
      <LuxuryLoader isReady={sceneReady} />

      {/* Top Editorial Navigation Bar */}
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        formattedPrice={formattedPrice}
        activeChapter={activeChapter}
        onJumpToSection={handleJumpToSection}
      />

      {/* Pinned Full-Viewport 3D Watch Studio Canvas */}
      <div className="fixed inset-0 z-0 w-full h-screen overflow-hidden">
        <StudioScene
          dialColor={dialColor}
          strapType={strapType}
          activeCallout={activeCallout}
          onSelectCallout={handleSelectCallout}
          poseRef={poseRef}
          cameraRef={cameraRef}
          isPaused={isPaused}
          showCalloutPins={showCalloutPins}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
          enablePostProcessing={true}
          enableStudioEnv={true}
          onReady={() => setSceneReady(true)}
        />
      </div>

      {/* Floating Scroll Progress Rail & Live Configurator Dock */}
      <FloatingAtelierDock
        dialColor={dialColor}
        onSelectDial={setDialColor}
        strapType={strapType}
        onSelectStrap={setStrapType}
        activeCallout={activeCallout}
        onSelectCallout={handleSelectCallout}
        showCalloutPins={showCalloutPins}
        onToggleCalloutPins={() => setShowCalloutPins(!showCalloutPins)}
        scrollProgress={scrollProgress}
        activeChapter={activeChapter}
        theme={theme}
      />

      {/* 7-Chapter Scroll Storytelling Content */}
      <ScrollStorySections
        dialColor={dialColor}
        onSelectDial={setDialColor}
        strapType={strapType}
        onSelectStrap={setStrapType}
        activeCallout={activeCallout}
        onSelectCallout={handleSelectCallout}
        totalPrice={totalPrice}
        formattedPrice={formattedPrice}
        theme={theme}
        onJumpToSection={handleJumpToSection}
      />
    </div>
  );
};

export default App;
