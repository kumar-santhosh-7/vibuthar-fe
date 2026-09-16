import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

const quotes = [
  {
    kural: "391",
    ta: "கற்க கசடறக் கற்பவை கற்றபின் நிற்க அதற்குத் தக.",
    en: "Learn thoroughly what is worth learning — then live by it.",
    source: "Thirukkural",
  },
  {
    kural: "392",
    ta: "எண்ணென்ப ஏனை எழுத்தென்ப இவ்விரண்டும் கண்ணென்ப வாழும் உயிர்க்கு.",
    en: "Letters and numbers — these two are the eyes of every living soul.",
    source: "Thirukkural",
  },
  
  {
    kural: "619",
    ta: "தெய்வத்தான் ஆகா தெனினும் முயற்சிதன் மெய்வருத்தக் கூலி தரும்.",
    en: "Even if fate withholds, honest effort still pays its wage.",
    source: "Thirukkural",
  },
] as const;

const dust = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${4 + ((i * 17) % 92)}%`,
  delay: `${(i * 0.37) % 6}s`,
  duration: `${7 + (i % 5)}s`,
  size: 1.5 + (i % 3),
}));

function shouldPlayIntro() {
  if (typeof window === "undefined") return false;
  if (window.location.pathname !== "/") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BookIntro({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [phase, setPhase] = useState<"intro" | "app">(pathname === "/" ? "intro" : "app");
  const [entered, setEntered] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [turned, setTurned] = useState(0);
  const [exiting, setExiting] = useState(false);
  const exitingRef = useRef(false);

  const finish = useCallback(() => {
    document.body.style.overflow = "";
    document.documentElement.classList.remove("intro-lock");
    setPhase("app");
  }, []);

  const skip = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    window.setTimeout(finish, 900);
  }, [finish]);

  useLayoutEffect(() => {
    if (!shouldPlayIntro()) {
      document.documentElement.classList.remove("intro-lock");
      document.body.style.overflow = "";
      setPhase("app");
      return;
    }
    setEntered(false);
    setCoverOpen(false);
    setTurned(0);
    setExiting(false);
    exitingRef.current = false;
    setPhase("intro");
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("intro-lock");
  }, []);

  useEffect(() => {
    if (phase !== "intro") return;

    const timers = [
      window.setTimeout(() => setEntered(true), 60),
      window.setTimeout(() => setCoverOpen(true), 1200),
      window.setTimeout(() => setTurned(1), 4300),
      window.setTimeout(() => setTurned(2), 7400),
      window.setTimeout(() => setTurned(3), 10500),
      window.setTimeout(() => {
        exitingRef.current = true;
        setExiting(true);
      }, 13600),
      window.setTimeout(finish, 14700),
    ];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, finish, skip]);

  const activeIndex = Math.min(turned, quotes.length);

  return (
    <>
      <AnimatePresence>
        {phase === "intro" && (
        <motion.div
          className="book-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Vibuthar opening"
          initial={{ opacity: 1 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="book-intro-vignette" />
          <div className="book-intro-grain" />
          <div className="book-intro-dust-layer">
            {dust.map((p) => (
              <span
                key={p.id}
                className="book-intro-dust"
                style={{
                  left: p.left,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                  width: p.size,
                  height: p.size,
                }}
              />
            ))}
          </div>

          <div className={`book-intro-scene${coverOpen ? " is-open" : ""}${exiting ? " is-out" : ""}`}>
            <div className="book-intro-glow" />
            <div className="book-intro-shadow" />
            <div className="book-intro-stage">
              <div className="book-intro-book">
                <div className="book-intro-hinge">
                  <div className="book-intro-leaf book-intro-title-leaf">
                    <TitlePage />
                  </div>

                  {quotes.map((quote, i) => (
                    <div
                      key={quote.kural}
                      className={`book-intro-page${turned > i ? " is-turned" : ""}`}
                      style={{ zIndex: 8 - i }}
                    >
                      <div className="book-intro-face book-intro-face-front">
                        <QuotePage quote={quote} index={i} />
                      </div>
                      <div className="book-intro-face book-intro-face-back">
                        <div className="book-intro-endpaper" />
                      </div>
                    </div>
                  ))}

                  <div className={`book-intro-cover${coverOpen ? " is-open" : ""}`}>
                    <div className="book-intro-face book-intro-cover-front">
                      <CoverFront />
                    </div>
                    <div className="book-intro-face book-intro-cover-back">
                      <CoverInside />
                    </div>
                  </div>

                  <div className={`book-intro-edge ${coverOpen ? "is-hidden" : ""}`} aria-hidden />
                </div>
              </div>
            </div>
          </div>
          <div className={`book-intro-scrim${entered ? " is-gone" : ""}`} />

          <div className="book-intro-chrome">
            <p className="book-intro-kicker">
              {coverOpen ? "A page from the academy" : "Vibuthar Academy"}
            </p>
            <div className="book-intro-dots" aria-hidden>
              {quotes.map((_, i) => (
                <span
                  key={i}
                  className={`book-intro-dot ${activeIndex === i && coverOpen && turned < quotes.length ? "is-on" : ""} ${turned > i ? "is-done" : ""}`}
                />
              ))}
              <span className={`book-intro-dot ${turned >= quotes.length ? "is-on" : ""}`} />
            </div>
            <button type="button" className="book-intro-skip" onClick={skip}>
              Skip intro
              <kbd>Esc</kbd>
            </button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
      {phase === "app" ? children : null}
    </>
  );
}

function CoverFront() {
  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center sm:px-8 sm:py-10">
      <p className="text-[10px] font-semibold tracking-[0.32em] text-gold uppercase">Since 2009</p>
      <div>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 font-serif text-3xl text-gold shadow-[0_0_24px_oklch(0.741_0.144_62/0.35)] sm:h-20 sm:w-20 sm:text-4xl">
          V
        </span>
        <h2 className="mt-5 font-serif text-2xl tracking-[0.18em] text-cream uppercase sm:text-3xl">
          Vibuthar
        </h2>
        <p className="mt-1 text-sm font-medium text-gold/90 text-tamil">விபுதர்</p>
        <span className="mx-auto mt-4 block h-px w-12 bg-gold/50" />
        <p className="mt-4 text-[10px] font-semibold tracking-[0.28em] text-cream/70 uppercase">
          Academy
        </p>
      </div>
      <p className="text-[10px] tracking-[0.14em] text-cream/45 uppercase">Sankarankovil</p>
    </div>
  );
}

function CoverInside() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 block h-px w-10 bg-gold/40" />
      <p className="font-serif text-lg leading-snug text-chocolate sm:text-xl">
        For every aspirant who reads before dawn.
      </p>
      <p className="mt-3 text-sm font-medium text-chocolate/80 text-tamil">
        விடியலுக்கு முன் படிக்கும் ஒவ்வொரு மாணவருக்கும்.
      </p>
      <span className="mt-5 block h-px w-10 bg-gold/40" />
    </div>
  );
}

function QuotePage({
  quote,
  index,
}: {
  quote: (typeof quotes)[number];
  index: number;
}) {
  return (
    <div className="flex h-full flex-col px-5 py-6 sm:px-7 sm:py-8">
      <p className="text-[10px] font-semibold tracking-[0.22em] text-gold uppercase">
        {quote.source} · {quote.kural}
      </p>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-serif text-[0.95rem] leading-[1.7] text-chocolate sm:text-[1.15rem] sm:leading-[1.75]">
          {quote.ta}
        </p>
        <span className="my-4 block h-px w-8 bg-gold/45" />
        <p className="font-serif text-sm leading-relaxed text-chocolate/75 italic sm:text-base">
          {quote.en}
        </p>
      </div>
      <p className="text-right text-[10px] tracking-widest text-chocolate/35">{index + 1}</p>
    </div>
  );
}

function TitlePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-5 text-center sm:px-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-gradient font-serif text-lg text-primary-foreground shadow-gold">
        V
      </span>
      <h2 className="mt-4 font-serif text-2xl text-chocolate sm:text-3xl">Vibuthar</h2>
      <p className="mt-1 text-sm font-medium text-chocolate text-tamil">விபுதர்</p>
      <span className="my-4 block h-px w-10 bg-gold/50" />
      <p className="max-w-[16ch] font-serif text-sm leading-snug text-chocolate/80 sm:text-base">
        The quiet craft of becoming a civil servant.
      </p>
      <p className="mt-2 max-w-[20ch] text-xs font-medium text-chocolate/70 text-tamil">
        அரசுப் பணிக்கான பயணம், அமைதியான பயிற்சியுடன்.
      </p>
    </div>
  );
}
