import React from 'react';
import {
  CalloutPartId,
  DIAL_SPECS,
  DialColorId,
  PART_CALLOUTS,
  STRAP_SPECS,
  StrapTypeId,
} from '../../types/watch';

interface FloatingAtelierDockProps {
  dialColor: DialColorId;
  onSelectDial: (dial: DialColorId) => void;
  strapType: StrapTypeId;
  onSelectStrap: (strap: StrapTypeId) => void;
  activeCallout: CalloutPartId;
  onSelectCallout: (part: CalloutPartId) => void;
  showCalloutPins: boolean;
  onToggleCalloutPins: () => void;
  scrollProgress: number;
  activeChapter: number;
  theme: 'dark' | 'light';
}

const CHAPTER_LABELS = [
  '00 · Overture',
  '01 · Dial Macro',
  '02 · Calibre M-01',
  '03 · 316L Case',
  '04 · Haberdashery',
  '05 · The Trilogy',
  '06 · Private Salon',
];

export const FloatingAtelierDock: React.FC<FloatingAtelierDockProps> = ({
  dialColor,
  onSelectDial,
  strapType,
  onSelectStrap,
  activeCallout,
  onSelectCallout,
  showCalloutPins,
  onToggleCalloutPins,
  scrollProgress,
  activeChapter,
  theme,
}) => {
  const isLight = theme === 'light';

  return (
    <>
      {/* Right-hand Vertical Horological Scroll Progress Indicator */}
      <aside
        aria-label="Scroll Story Progress"
        className="fixed right-4 sm:right-7 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-end gap-3 pointer-events-none"
      >
        <div className="text-right">
          <p className="text-[10px] tracking-[0.26em] uppercase text-[#D8C3A0] font-medium">
            {CHAPTER_LABELS[activeChapter] || CHAPTER_LABELS[0]}
          </p>
          <p className="text-[10px] tracking-[0.2em] text-[#8FA3B8] font-mono">
            {String(Math.round(scrollProgress * 100)).padStart(2, '0')}%
          </p>
        </div>

        <div className="relative w-[2px] h-44 bg-[#8FA3B8]/20 overflow-hidden rounded-full">
          <div
            className="w-full bg-[#D8C3A0] transition-all duration-150 ease-out"
            style={{ height: `${Math.max(4, scrollProgress * 100)}%` }}
          />
        </div>

        {/* Fine graduation ticks */}
        <div className="flex flex-col gap-1.5 items-end">
          {CHAPTER_LABELS.map((_, idx) => (
            <span
              key={idx}
              className={`block h-[1px] transition-all duration-300 ${
                activeChapter === idx
                  ? 'w-4 bg-[#D9662E]'
                  : 'w-2 bg-[#8FA3B8]/40'
              }`}
            />
          ))}
        </div>
      </aside>

      {/* Bottom Interactive Configurator & Callout Bar */}
      <div
        role="toolbar"
        aria-label="Interactive Watch Configurator: Dial Finish, Strap Material, and Technical Callouts"
        className={`fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[95vw] max-w-4xl px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-sm border backdrop-blur-md transition-colors duration-500 ${
          isLight
            ? 'bg-[#F2EEE6]/95 border-[#0B1522]/15 text-[#0B1522] shadow-xl'
            : 'bg-[#0B1522]/94 border-[#8FA3B8]/25 text-[#F2EEE6] shadow-[0_16px_48px_rgba(0,0,0,0.75)]'
        }`}
      >
        {activeCallout && (
          <div
            className={`mb-2.5 pb-2.5 border-b flex items-start justify-between gap-4 ${
              isLight ? 'border-[#0B1522]/15' : 'border-[#8FA3B8]/20'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D9662E]" />
                <span className="text-[10px] tracking-[0.24em] uppercase text-[#D9662E] font-semibold">
                  {PART_CALLOUTS[activeCallout].label}
                </span>
                <span className="font-serif text-base sm:text-lg leading-none">
                  {PART_CALLOUTS[activeCallout].title}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#8FA3B8] leading-relaxed">
                {PART_CALLOUTS[activeCallout].spec}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectCallout(null)}
              aria-label="Close part specification"
              className="px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase border border-[#8FA3B8]/30 rounded-sm text-[#8FA3B8] hover:border-[#D8C3A0] hover:text-[#D8C3A0] shrink-0"
            >
              Close
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6">
          {/* 1. Dial Color Switcher (Glacier, Midnight, Verdigris, Ivory) */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8] hidden sm:inline">
              Dial
            </span>
            <div className="flex items-center gap-1.5" role="group" aria-label="Dial Color">
              {(Object.keys(DIAL_SPECS) as DialColorId[]).map((id) => {
                const spec = DIAL_SPECS[id];
                const selected = dialColor === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectDial(id)}
                    aria-pressed={selected}
                    aria-label={`${spec.name} dial`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                      selected
                        ? 'border-[#D8C3A0] bg-[#D8C3A0]/15 font-semibold'
                        : 'border-transparent hover:border-[#8FA3B8]/35 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: spec.hex }}
                    />
                    <span className="capitalize">{id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Strap Switcher (Leather, Steel, Nylon) */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8] hidden sm:inline">
              Strap
            </span>
            <div className="flex items-center gap-1.5" role="group" aria-label="Strap Material">
              {(Object.keys(STRAP_SPECS) as StrapTypeId[]).map((id) => {
                const selected = strapType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectStrap(id)}
                    aria-pressed={selected}
                    aria-label={`Select ${STRAP_SPECS[id].name}`}
                    className={`px-2.5 py-1 rounded-sm border text-[11px] tracking-[0.14em] uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                      selected
                        ? 'border-[#D8C3A0] bg-[#D8C3A0] text-[#0B1522] font-semibold'
                        : 'border-[#8FA3B8]/25 hover:border-[#D8C3A0]/50'
                    }`}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Part Callout Inspector Buttons (Crown, Crystal, Date, Lugs) */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleCalloutPins}
              aria-pressed={showCalloutPins}
              className={`px-2 py-1 text-[10px] tracking-[0.18em] uppercase border rounded-sm transition-colors ${
                showCalloutPins
                  ? 'border-[#D8C3A0]/60 text-[#D8C3A0]'
                  : 'border-[#8FA3B8]/25 text-[#8FA3B8]'
              }`}
            >
              Pins
            </button>
            {(Object.keys(PART_CALLOUTS) as Array<Exclude<CalloutPartId, null>>).map(
              (partId) => {
                const active = activeCallout === partId;
                return (
                  <button
                    key={partId}
                    type="button"
                    onClick={() => onSelectCallout(active ? null : partId)}
                    aria-pressed={active}
                    className={`px-2 py-1 text-[10px] tracking-[0.16em] uppercase rounded-sm border transition-all focus:outline-none focus:ring-1 focus:ring-[#D8C3A0] ${
                      active
                        ? isLight
                          ? 'border-[#D9662E] bg-[#D9662E]/15 text-[#0B1522] font-semibold'
                          : 'border-[#D9662E] bg-[#D9662E]/20 text-[#F2EEE6]'
                        : 'border-transparent text-[#8FA3B8] hover:text-[#D8C3A0]'
                    }`}
                  >
                    {partId}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </>
  );
};
