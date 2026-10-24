import React from 'react';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  formattedPrice: string;
  activeChapter: number;
  onJumpToSection: (sectionId: string) => void;
}

const NAV_ITEMS = [
  { id: 'section-dial', label: '01 · Dial' },
  { id: 'section-movement', label: '02 · Calibre M-01' },
  { id: 'section-case', label: '03 · 316L Case' },
  { id: 'section-straps', label: '04 · Straps' },
  { id: 'section-collection', label: '05 · Collection' },
  { id: 'section-viewing', label: '06 · Salon' },
];

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  isPaused,
  onTogglePause,
  formattedPrice,
  activeChapter,
  onJumpToSection,
}) => {
  const isLight = theme === 'light';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 border-b ${
        isLight
          ? 'bg-[#F2EEE6]/85 border-[#0B1522]/12 text-[#0B1522]'
          : 'bg-[#0B1522]/75 border-[#8FA3B8]/15 text-[#F2EEE6]'
      } backdrop-blur-md`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Crest & Wordmark */}
        <a
          href="#section-hero"
          onClick={(e) => {
            e.preventDefault();
            onJumpToSection('section-hero');
          }}
          className="group flex items-center gap-3 focus:outline-none focus:ring-1 focus:ring-[#D8C3A0] rounded-sm py-1"
          aria-label="MERIDIAN Genève — Return to top"
        >
          <span className="relative flex items-center justify-center w-7 h-7 rounded-full border border-[#D8C3A0]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9662E]" />
          </span>
          <div className="flex flex-col">
            <span className="font-serif text-lg sm:text-xl tracking-[0.26em] leading-none">
              MERIDIAN
            </span>
            <span className="text-[9px] tracking-[0.34em] uppercase text-[#8FA3B8] mt-0.5">
              Genève · 1894
            </span>
          </div>
        </a>

        {/* Chapter Links (Desktop) */}
        <nav
          aria-label="Horological Chapters"
          className="hidden xl:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item, idx) => {
            const isActive = activeChapter === idx + 1;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onJumpToSection(item.id)}
                className={`text-xs tracking-[0.2em] uppercase transition-colors py-1 border-b focus:outline-none focus:ring-1 focus:ring-[#D8C3A0] ${
                  isActive
                    ? 'text-[#D8C3A0] border-[#D8C3A0]'
                    : isLight
                      ? 'text-[#0B1522]/70 border-transparent hover:text-[#0B1522]'
                      : 'text-[#8FA3B8] border-transparent hover:text-[#F2EEE6]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Utility Controls: Escapement Tick Audio, 3D Pause, Theme, Salon CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mechanical Tick Audio Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={
              soundEnabled
                ? 'Mute 4Hz mechanical escapement tick sound'
                : 'Enable 4Hz mechanical escapement tick sound'
            }
            className={`px-2.5 py-1.5 text-[10px] tracking-[0.18em] uppercase border rounded-sm transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
              soundEnabled
                ? 'border-[#D9662E] text-[#F2EEE6] bg-[#D9662E]/20'
                : isLight
                  ? 'border-[#0B1522]/20 text-[#0B1522]/80 hover:border-[#0B1522]/50'
                  : 'border-[#8FA3B8]/25 text-[#8FA3B8] hover:text-[#F2EEE6] hover:border-[#D8C3A0]/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                soundEnabled ? 'bg-[#D9662E] animate-pulse' : 'bg-[#8FA3B8]/50'
              }`}
            />
            <span className="hidden sm:inline">4Hz Tick</span>
            <span>{soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* 3D Animation Pause/Resume Control (Accessibility) */}
          <button
            type="button"
            onClick={onTogglePause}
            aria-pressed={isPaused}
            aria-label={isPaused ? 'Resume 3D watch motion' : 'Pause 3D watch motion'}
            className={`px-2.5 py-1.5 text-[10px] tracking-[0.18em] uppercase border rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
              isPaused
                ? 'border-[#D8C3A0] text-[#D8C3A0]'
                : isLight
                  ? 'border-[#0B1522]/20 text-[#0B1522]/80 hover:border-[#0B1522]/50'
                  : 'border-[#8FA3B8]/25 text-[#8FA3B8] hover:text-[#F2EEE6] hover:border-[#D8C3A0]/50'
            }`}
          >
            {isPaused ? 'Resume 3D' : 'Pause 3D'}
          </button>

          {/* Light / Dark Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              isLight ? 'Switch to Nocturnal Ink Navy theme' : 'Switch to Daylight Ivory theme'
            }
            className={`px-2.5 py-1.5 text-[10px] tracking-[0.18em] uppercase border rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
              isLight
                ? 'border-[#0B1522]/20 text-[#0B1522] hover:bg-[#0B1522]/5'
                : 'border-[#8FA3B8]/25 text-[#8FA3B8] hover:text-[#F2EEE6] hover:border-[#D8C3A0]/50'
            }`}
          >
            {isLight ? 'Nocturne' : 'Ivory'}
          </button>

          {/* Live Price & Private Salon CTA */}
          <button
            type="button"
            onClick={() => onJumpToSection('section-viewing')}
            className="hidden md:flex items-center gap-3 pl-3.5 pr-4 py-1.5 text-[11px] tracking-[0.18em] uppercase bg-[#D8C3A0] text-[#0B1522] font-semibold rounded-sm hover:bg-[#F2EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9662E]"
          >
            <span>{formattedPrice}</span>
            <span className="w-px h-3 bg-[#0B1522]/25" />
            <span>Private Viewing</span>
          </button>
        </div>
      </div>
    </header>
  );
};
