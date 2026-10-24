import React, { useState } from 'react';
import {
  BASE_WATCH_PRICE,
  CalloutPartId,
  COLLECTION_REFERENCES,
  DIAL_SPECS,
  DialColorId,
  PART_CALLOUTS,
  STRAP_SPECS,
  StrapTypeId,
} from '../../types/watch';

interface ScrollStorySectionsProps {
  dialColor: DialColorId;
  onSelectDial: (dial: DialColorId) => void;
  strapType: StrapTypeId;
  onSelectStrap: (strap: StrapTypeId) => void;
  activeCallout: CalloutPartId;
  onSelectCallout: (part: CalloutPartId) => void;
  totalPrice: number;
  formattedPrice: string;
  theme: 'dark' | 'light';
  onJumpToSection: (sectionId: string) => void;
}

interface BookingFormState {
  fullName: string;
  email: string;
  salon: string;
  preferredDate: string;
  notes: string;
}

interface BookingFormErrors {
  fullName?: string;
  email?: string;
  preferredDate?: string;
}

export const ScrollStorySections: React.FC<ScrollStorySectionsProps> = ({
  dialColor,
  onSelectDial,
  strapType,
  onSelectStrap,
  activeCallout,
  onSelectCallout,
  formattedPrice,
  theme,
  onJumpToSection,
}) => {
  const isLight = theme === 'light';
  const currentDial = DIAL_SPECS[dialColor];
  const currentStrap = STRAP_SPECS[strapType];

  // Collection horizontal carousel active index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Private viewing booking state
  const [form, setForm] = useState<BookingFormState>({
    fullName: '',
    email: '',
    salon: 'Geneva — Rue du Rhône 42',
    preferredDate: '2026-11-14',
    notes: '',
  });
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [dossierCode, setDossierCode] = useState('');

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: BookingFormErrors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your full name for the salon register.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = 'Please provide a valid email address for your invitation.';
    }
    if (!form.preferredDate) {
      nextErrors.preferredDate = 'Please select a preferred date for your private viewing.';
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setDossierCode(`MRD-GVA-${randomNum}`);
      setBookingConfirmed(true);
    }
  };

  const panelClass = isLight
    ? 'bg-[#F2EEE6]/95 border-[#0B1522]/15 text-[#0B1522] shadow-2xl'
    : 'bg-[#0B1522]/94 border-[#8FA3B8]/25 text-[#F2EEE6] shadow-[0_24px_60px_rgba(0,0,0,0.75)]';

  const mutedTextClass = isLight ? 'text-[#0B1522]/75' : 'text-[#9FB2C7]';

  return (
    <main className="relative z-10 pointer-events-none">
      {/* =================================================================== */}
      {/* CHAPTER 01 · HERO ("Time, kept properly.")                          */}
      {/* =================================================================== */}
      <section
        id="section-hero"
        data-chapter="0"
        className="min-h-screen w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 md:pr-28 pt-28 pb-32 flex flex-col justify-center"
      >
        <div
          className={`max-w-xl pointer-events-auto rounded-sm transition-colors ${
            isLight
              ? 'max-lg:bg-[#F2EEE6]/94 max-lg:p-6 max-lg:border max-lg:border-[#0B1522]/15 max-lg:shadow-xl max-lg:backdrop-blur-md'
              : 'max-lg:bg-[#0B1522]/92 max-lg:p-6 max-lg:border max-lg:border-[#8FA3B8]/20 max-lg:shadow-2xl max-lg:backdrop-blur-md'
          }`}
        >
          <div className="inline-flex items-center gap-3 px-3 py-1 border border-[#D8C3A0]/40 rounded-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9662E]" />
            <span className="text-[10px] tracking-[0.28em] uppercase text-[#D8C3A0] font-medium">
              Manufacture de Haute Horlogerie · {currentDial.referenceCode}
            </span>
          </div>

          <h1 className="font-serif text-6xl sm:text-7xl lg:text-[88px] leading-[0.94] tracking-[-0.02em]">
            Time, kept <span className="italic text-[#D8C3A0]">properly.</span>
          </h1>

          <p className={`mt-6 text-base sm:text-lg leading-relaxed max-w-md ${mutedTextClass}`}>
            Engineered in Geneva from cold-forged 316L surgical steel. Driven by the
            in-house Calibre M-01 automatic chronometer with a 72-hour twin-barrel
            reserve and a single copper sweep hand.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onJumpToSection('section-dial')}
              className="px-6 py-3 bg-[#D8C3A0] text-[#0B1522] text-xs tracking-[0.22em] uppercase font-semibold rounded-sm hover:bg-[#F2EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9662E]"
            >
              Explore the Film
            </button>
            <button
              type="button"
              onClick={() => onJumpToSection('section-viewing')}
              className={`px-6 py-3 border text-xs tracking-[0.22em] uppercase rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                isLight
                  ? 'border-[#0B1522]/30 text-[#0B1522] hover:bg-[#0B1522]/5'
                  : 'border-[#8FA3B8]/35 text-[#F2EEE6] hover:border-[#D8C3A0]'
              }`}
            >
              Reserve Viewing · {formattedPrice}
            </button>
          </div>

          {/* Bottom Hero Technical Specs Strip (Stacked in Left Column Above Dock) */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-5 pt-6 border-t border-[#8FA3B8]/25">
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8]">
                Calibre
              </p>
              <p className="mt-1 font-serif text-xl sm:text-2xl text-[#D8C3A0]">M-01 Auto</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8]">
                Power Reserve
              </p>
              <p className="mt-1 font-serif text-xl sm:text-2xl">72 Hours</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8]">
                Refractive Index
              </p>
              <p className="mt-1 font-serif text-xl sm:text-2xl">1.77 Sapphire</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8]">
                Precision
              </p>
              <p className="mt-1 font-serif text-xl sm:text-2xl">-2 / +2 s/d</p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CHAPTER 02 · DIAL MACRO (Sunburst Finish & Super-LumiNova Lume)     */}
      {/* =================================================================== */}
      <section
        id="section-dial"
        data-chapter="1"
        className="min-h-screen w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 md:pr-28 py-28 flex items-center justify-end"
      >
        <div
          className={`w-full max-w-lg p-7 sm:p-10 rounded-sm border backdrop-blur-md pointer-events-auto ${panelClass}`}
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#D8C3A0] font-semibold">
            Chapter I · The Dial Architecture
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04]">
            Radial sunburst, cut to the micron.
          </h2>
          <p className={`mt-5 text-sm sm:text-base leading-relaxed ${mutedTextClass}`}>
            Each brass dial blank is spun against diamond-charged bronze brushes to
            score microscopic radial rays from the center pinion. Under grazing
            light, two opposing cones of silk reflection sweep across the surface.
          </p>
          <p className={`mt-4 text-sm sm:text-base leading-relaxed ${mutedTextClass}`}>
            Eleven hand-applied diamond-cut rhodium indices are milled to a 0.38mm
            profile depth and filled with Grade X1 Super-LumiNova BGW9, casting
            authentic shadows beneath the stepped Dauphine hands and our signature{' '}
            <span className="text-[#D9662E] font-medium">oxidized copper</span>{' '}
            sweep seconds hand.
          </p>

          {/* Dial Color Cross-Fade Selector */}
          <div className="mt-7 pt-6 border-t border-[#8FA3B8]/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.24em] uppercase text-[#8FA3B8]">
                Select Dial Finish
              </span>
              <span className="text-xs font-serif italic text-[#D8C3A0]">
                {currentDial.name} — {currentDial.subtitle}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(DIAL_SPECS) as DialColorId[]).map((id) => {
                const spec = DIAL_SPECS[id];
                const active = dialColor === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectDial(id)}
                    aria-pressed={active}
                    className={`flex flex-col items-start p-2.5 rounded-sm border text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                      active
                        ? 'border-[#D8C3A0] bg-[#D8C3A0]/15'
                        : 'border-[#8FA3B8]/25 hover:border-[#D8C3A0]/50'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/30 mb-2"
                      style={{ backgroundColor: spec.hex }}
                    />
                    <span className="text-xs font-medium capitalize">{id}</span>
                    <span className="text-[10px] text-[#8FA3B8] truncate w-full">
                      {spec.referenceCode.replace('REF. ', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CHAPTER 03 · MOVEMENT (Display Caseback & 72-Hour Power Reserve)    */}
      {/* =================================================================== */}
      <section
        id="section-movement"
        data-chapter="2"
        className="min-h-screen w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 py-28 flex items-center justify-start"
      >
        <div
          className={`w-full max-w-lg p-7 sm:p-10 rounded-sm border backdrop-blur-md pointer-events-auto ${panelClass}`}
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#D8C3A0] font-semibold">
            Chapter II · Exhibition Caseback
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04]">
            Calibre M-01. Seventy-two hours of poise.
          </h2>
          <p className={`mt-5 text-sm sm:text-base leading-relaxed ${mutedTextClass}`}>
            Turn the timepiece to reveal the openworked 22-karat rose-gold winding
            rotor gliding on ceramic ball bearings. Twin series-coupled mainspring
            barrels deliver a constant-force 72-hour power reserve—allowing the watch
            to be set down on Friday evening and resumed on Monday morning without
            losing a beat.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-4 pt-6 border-t border-[#8FA3B8]/20">
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8]">
                Frequency
              </p>
              <p className="mt-1 font-serif text-2xl text-[#D8C3A0]">
                28,800 vph (4 Hz)
              </p>
              <p className="text-xs text-[#8FA3B8] mt-0.5">
                Free-sprung variable inertia balance
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#8FA3B8]">
                Bridge Decoration
              </p>
              <p className="mt-1 font-serif text-2xl text-[#D8C3A0]">
                Côtes de Genève
              </p>
              <p className="text-xs text-[#8FA3B8] mt-0.5">
                32 synthetic rubies · Blued screws
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CHAPTER 04 · CASE & BEZEL (316L Steel & 1.77 IOR Sapphire)          */}
      {/* =================================================================== */}
      <section
        id="section-case"
        data-chapter="3"
        className="min-h-screen w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 md:pr-28 py-28 flex items-center justify-end"
      >
        <div
          className={`w-full max-w-lg p-7 sm:p-10 rounded-sm border backdrop-blur-md pointer-events-auto ${panelClass}`}
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#D8C3A0] font-semibold">
            Chapter III · Metallurgy & Optics
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04]">
            Satin-brushed flanks. Mirror-polished bevels.
          </h2>
          <p className={`mt-5 text-sm sm:text-base leading-relaxed ${mutedTextClass}`}>
            Stamping and CNC-turning the 40mm case from low-carbon 316L surgical steel
            is only the prelude. Master finishers spend four hours per case executing
            vertical satin graining across the mid-case and lugs, contrasted against
            hand-polished 45° anglage chamfers that catch studio light like liquid
            mercury.
          </p>
          <p className={`mt-4 text-sm sm:text-base leading-relaxed ${mutedTextClass}`}>
            Crowning the bezel is a box-domed synthetic sapphire crystal with a
            refractive index of 1.77 and six layers of vacuum-deposited anti-reflective
            treatment.
          </p>

          {/* Interactive Part Callout Inspector Buttons */}
          <div className="mt-7 pt-6 border-t border-[#8FA3B8]/20">
            <p className="text-[10px] tracking-[0.24em] uppercase text-[#8FA3B8] mb-3">
              Inspect Micro-Architecture (Click to Highlight on 3D Watch)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(PART_CALLOUTS) as Array<Exclude<CalloutPartId, null>>).map(
                (partId) => {
                  const info = PART_CALLOUTS[partKeyOrId(partId)];
                  const active = activeCallout === partId;
                  return (
                    <button
                      key={partId}
                      type="button"
                      onClick={() => onSelectCallout(active ? null : partId)}
                      aria-pressed={active}
                      className={`p-3 rounded-sm border text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                        active
                          ? 'border-[#D9662E] bg-[#D9662E]/15'
                          : 'border-[#8FA3B8]/25 hover:border-[#D8C3A0]/50'
                      }`}
                    >
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#D8C3A0] block">
                        {info.label}
                      </span>
                      <span className="font-serif text-base block mt-0.5">
                        {info.title}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CHAPTER 05 · STRAPS & LIVE PRICE CONFIGURATOR                       */}
      {/* =================================================================== */}
      <section
        id="section-straps"
        data-chapter="4"
        className="min-h-screen w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 py-28 flex items-center justify-start"
      >
        <div
          className={`w-full max-w-lg p-7 sm:p-10 rounded-sm border backdrop-blur-md pointer-events-auto ${panelClass}`}
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#D8C3A0] font-semibold">
            Chapter IV · Bespoke Haberdashery
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04]">
            Three expressions of ergonomics.
          </h2>
          <p className={`mt-4 text-sm sm:text-base leading-relaxed ${mutedTextClass}`}>
            Swap seamlessly between our hand-stitched French Barénia calfskin strap,
            the tapered 3-link integrated 316L steel bracelet, or the hydro-weave
            maritime sailcloth strap.
          </p>

          {/* Strap Selector Cards with Live Price Delta */}
          <div className="mt-6 space-y-3" role="radiogroup" aria-label="Strap Selection">
            {(Object.keys(STRAP_SPECS) as StrapTypeId[]).map((id) => {
              const spec = STRAP_SPECS[id];
              const selected = strapType === id;
              const itemPrice = BASE_WATCH_PRICE + spec.priceDelta;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectStrap(id)}
                  aria-pressed={selected}
                  className={`w-full p-4 rounded-sm border text-left transition-all flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                    selected
                      ? 'border-[#D8C3A0] bg-[#D8C3A0]/15'
                      : 'border-[#8FA3B8]/25 hover:border-[#D8C3A0]/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className="w-6 h-6 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: spec.swatchHex }}
                    />
                    <div>
                      <p className="font-serif text-lg leading-tight">{spec.name}</p>
                      <p className="text-xs text-[#8FA3B8] mt-0.5">{spec.material}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif text-lg text-[#D8C3A0]">
                      ${itemPrice.toLocaleString('en-US')}
                    </p>
                    <p className="text-[10px] tracking-wider uppercase text-[#8FA3B8]">
                      {spec.priceDelta === 0
                        ? 'Included'
                        : spec.priceDelta > 0
                          ? `+$${spec.priceDelta}`
                          : `-$${Math.abs(spec.priceDelta)}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Total Summary Bar */}
          <div className="mt-6 pt-5 border-t border-[#8FA3B8]/25 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.24em] uppercase text-[#8FA3B8]">
                Configured Timepiece
              </p>
              <p className="text-xs text-[#D8C3A0] mt-0.5">
                {currentDial.name} · {currentStrap.clasp}
              </p>
            </div>
            <p className="font-serif text-3xl tracking-tight">{formattedPrice}</p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CHAPTER 06 · COLLECTION (Horizontal Parallax Carousel of 3 Models)  */}
      {/* =================================================================== */}
      <section
        id="section-collection"
        data-chapter="5"
        className="min-h-screen w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 md:pr-28 py-28 flex flex-col justify-end"
      >
        <div
          className={`w-full p-7 sm:p-10 rounded-sm border backdrop-blur-md pointer-events-auto ${panelClass}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#8FA3B8]/20">
            <div>
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#D8C3A0] font-semibold">
                Chapter V · The Reference Trilogy
              </p>
              <h2 className="mt-2 font-serif text-4xl sm:text-5xl leading-none">
                Three references. One standard.
              </h2>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous Collection Reference"
                onClick={() =>
                  setCarouselIndex(
                    (prev) =>
                      (prev - 1 + COLLECTION_REFERENCES.length) %
                      COLLECTION_REFERENCES.length
                  )
                }
                className="px-3.5 py-2 border border-[#8FA3B8]/30 rounded-sm text-xs tracking-widest uppercase hover:border-[#D8C3A0] transition-colors"
              >
                Prev
              </button>
              <button
                type="button"
                aria-label="Next Collection Reference"
                onClick={() =>
                  setCarouselIndex(
                    (prev) => (prev + 1) % COLLECTION_REFERENCES.length
                  )
                }
                className="px-3.5 py-2 border border-[#8FA3B8]/30 rounded-sm text-xs tracking-widest uppercase hover:border-[#D8C3A0] transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Horizontal Parallax Cards */}
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {COLLECTION_REFERENCES.map((refModel, idx) => {
              const isSelectedRef =
                dialColor === refModel.dial && strapType === refModel.strap;
              const isHighlightedCard = carouselIndex === idx;
              const dialSpec = DIAL_SPECS[refModel.dial];

              return (
                <article
                  key={refModel.id}
                  onMouseEnter={() => setCarouselIndex(idx)}
                  className={`p-6 rounded-sm border transition-all duration-500 flex flex-col justify-between ${
                    isSelectedRef
                      ? isLight
                        ? 'border-[#D8C3A0] bg-[#EFE9DC]'
                        : 'border-[#D8C3A0] bg-[#142336]'
                      : isHighlightedCard
                        ? isLight
                          ? 'border-[#0B1522]/30 bg-white/95'
                          : 'border-[#8FA3B8]/50 bg-[#101D2E]/95'
                        : isLight
                          ? 'border-[#0B1522]/15 bg-white/90'
                          : 'border-[#8FA3B8]/25 bg-[#0D1928]/95'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.26em] uppercase text-[#D8C3A0] font-semibold">
                        {refModel.refNumber}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full border border-white/40"
                        style={{ backgroundColor: dialSpec.hex }}
                        title={dialSpec.name}
                      />
                    </div>

                    <h3 className="mt-3 font-serif text-2xl sm:text-3xl">
                      {refModel.name}
                    </h3>
                    <p className="mt-1 text-xs tracking-wider uppercase text-[#8FA3B8]">
                      {refModel.subtitle}
                    </p>
                    <p className={`mt-4 text-xs sm:text-sm leading-relaxed ${mutedTextClass}`}>
                      {refModel.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#8FA3B8]/20">
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#8FA3B8]">
                        Allocation Price
                      </span>
                      <span className="font-serif text-2xl text-[#D8C3A0]">
                        ${refModel.basePrice.toLocaleString('en-US')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCarouselIndex(idx);
                        onSelectDial(refModel.dial);
                        onSelectStrap(refModel.strap);
                      }}
                      className={`w-full py-2.5 text-[11px] tracking-[0.2em] uppercase rounded-sm border transition-all focus:outline-none focus:ring-2 focus:ring-[#D8C3A0] ${
                        isSelectedRef
                          ? 'bg-[#D8C3A0] text-[#0B1522] border-[#D8C3A0] font-semibold'
                          : 'border-[#D8C3A0]/50 text-[#D8C3A0] hover:bg-[#D8C3A0] hover:text-[#0B1522]'
                      }`}
                    >
                      {isSelectedRef
                        ? 'Active in 3D Studio'
                        : 'Configure in 3D Studio'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CHAPTER 07 · PRIVATE VIEWING (Minimal Salon Booking Form)           */}
      {/* =================================================================== */}
      <section
        id="section-viewing"
        data-chapter="6"
        className="min-h-screen w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-20 md:pr-28 py-28 flex items-center justify-end"
      >
        <div
          className={`w-full max-w-xl p-7 sm:p-11 rounded-sm border backdrop-blur-md pointer-events-auto ${panelClass}`}
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#D8C3A0] font-semibold">
            Chapter VI · Private Salon Appointment
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl leading-[1.04]">
            Experience MERIDIAN on the wrist.
          </h2>
          <p className={`mt-3 text-sm leading-relaxed ${mutedTextClass}`}>
            Private viewings are hosted by a master horologist in our Geneva, Tokyo,
            New York, and London salons. Your configured reference is prepared ahead
            of your arrival.
          </p>

          {/* Current Configuration Summary Pill */}
          <div className="mt-5 p-3.5 rounded-sm border border-[#D8C3A0]/35 bg-[#D8C3A0]/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#D8C3A0]">
                Selected Dossier Configuration
              </p>
              <p className="font-serif text-lg">
                {currentDial.name} · {currentStrap.name}
              </p>
            </div>
            <span className="font-serif text-2xl text-[#D8C3A0]">
              {formattedPrice}
            </span>
          </div>

          {bookingConfirmed ? (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-7 p-6 rounded-sm border border-[#D8C3A0] bg-[#D8C3A0]/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.28em] uppercase text-[#D8C3A0] font-semibold">
                  Private Viewing Confirmed
                </span>
                <span className="text-xs font-mono text-[#D9662E]">
                  {dossierCode}
                </span>
              </div>
              <h3 className="font-serif text-3xl">
                We await your arrival, {form.fullName}.
              </h3>
              <p className={`text-sm leading-relaxed ${mutedTextClass}`}>
                Our Director of Client Relations at{' '}
                <strong className="text-[#D8C3A0] font-normal">{form.salon}</strong>{' '}
                has reserved your private viewing for{' '}
                <strong className="text-[#D8C3A0] font-normal">
                  {form.preferredDate}
                </strong>
                . A formal dossier for your{' '}
                <strong className="text-[#D8C3A0] font-normal">
                  {currentDial.referenceCode}
                </strong>{' '}
                has been dispatched to {form.email}.
              </p>
              <button
                type="button"
                onClick={() => setBookingConfirmed(false)}
                className="mt-2 px-4 py-2 text-[11px] tracking-[0.2em] uppercase border border-[#D8C3A0]/50 rounded-sm hover:bg-[#D8C3A0] hover:text-[#0B1522] transition-colors"
              >
                Modify Appointment
              </button>
            </div>
          ) : (
            <form
              onSubmit={validateAndSubmit}
              noValidate
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="viewing-fullname"
                  className="block text-[10px] tracking-[0.24em] uppercase text-[#8FA3B8] mb-1.5"
                >
                  Full Name *
                </label>
                <input
                  id="viewing-fullname"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  placeholder="Lord / Lady / M. Alexandre Vacheron"
                  className="w-full px-3.5 py-2.5 text-sm bg-transparent border border-[#8FA3B8]/35 rounded-sm focus:outline-none focus:border-[#D8C3A0]"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-[#D9662E]" role="alert">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="viewing-email"
                    className="block text-[10px] tracking-[0.24em] uppercase text-[#8FA3B8] mb-1.5"
                  >
                    Private Email *
                  </label>
                  <input
                    id="viewing-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="client@meridian-geneve.ch"
                    className="w-full px-3.5 py-2.5 text-sm bg-transparent border border-[#8FA3B8]/35 rounded-sm focus:outline-none focus:border-[#D8C3A0]"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#D9662E]" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="viewing-date"
                    className="block text-[10px] tracking-[0.24em] uppercase text-[#8FA3B8] mb-1.5"
                  >
                    Preferred Date *
                  </label>
                  <input
                    id="viewing-date"
                    type="date"
                    required
                    value={form.preferredDate}
                    onChange={(e) =>
                      setForm({ ...form, preferredDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-transparent border border-[#8FA3B8]/35 rounded-sm focus:outline-none focus:border-[#D8C3A0]"
                  />
                  {errors.preferredDate && (
                    <p className="mt-1 text-xs text-[#D9662E]" role="alert">
                      {errors.preferredDate}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="viewing-salon"
                  className="block text-[10px] tracking-[0.24em] uppercase text-[#8FA3B8] mb-1.5"
                >
                  Salon Location
                </label>
                <select
                  id="viewing-salon"
                  value={form.salon}
                  onChange={(e) => setForm({ ...form, salon: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm border border-[#8FA3B8]/35 rounded-sm focus:outline-none focus:border-[#D8C3A0] ${
                    isLight
                      ? 'bg-[#F2EEE6] text-[#0B1522]'
                      : 'bg-[#0B1522] text-[#F2EEE6]'
                  }`}
                >
                  <option value="Geneva — Rue du Rhône 42">
                    Geneva — Rue du Rhône 42 (Manufacture Salon)
                  </option>
                  <option value="Tokyo — Ginza Namiki-dori">
                    Tokyo — Ginza Namiki-dori
                  </option>
                  <option value="New York — 712 Madison Avenue">
                    New York — 712 Madison Avenue
                  </option>
                  <option value="London — 28 New Bond Street">
                    London — 28 New Bond Street
                  </option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#D8C3A0] text-[#0B1522] text-xs tracking-[0.24em] uppercase font-semibold rounded-sm hover:bg-[#F2EEE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9662E]"
              >
                Request Private Salon Invitation
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Editorial Footer */}
      <footer
        className={`relative z-20 pointer-events-auto border-t py-10 px-6 sm:px-12 lg:px-20 ${
          isLight
            ? 'bg-[#F2EEE6] border-[#0B1522]/15 text-[#0B1522]'
            : 'bg-[#0B1522] border-[#8FA3B8]/15 text-[#8FA3B8]'
        }`}
      >
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg tracking-[0.24em] text-[#D8C3A0]">
              MERIDIAN
            </span>
            <span>·</span>
            <span>Chronométrie de Genève · Calibre M-01 (CC0 Procedural CAD)</span>
          </div>
          <p className="text-[11px] tracking-[0.18em] uppercase">
            Poinçon de Genève · COSC Certified Chronometer · Swiss Made
          </p>
        </div>
      </footer>
    </main>
  );
};

function partKeyOrId(id: Exclude<CalloutPartId, null>): Exclude<CalloutPartId, null> {
  return id;
}
