import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import {
  Play,
  Sparkles,
  GraduationCap,
  Trophy,
  ArrowRight,
  Clock,
  Film,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCourses } from "@/lib/catalog";
import { useHeroSlides } from "@/lib/hero-slides";
import { CourseThumbnail } from "@/components/course-thumbnail";
import { Reveal, Eyebrow } from "@/components/section";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vibuthar — Premium UPSC Civil Services Coaching" },
      {
        name: "description",
        content:
          "Vibuthar is a mentor-led UPSC Civil Services academy: prelims foundation, mains answer writing, ethics and interview studios with an on-demand video library.",
      },
      { property: "og:title", content: "Vibuthar — Premium UPSC Civil Services Coaching" },
      {
        property: "og:description",
        content: "Mentor-led UPSC preparation with a cinematic on-demand video library.",
      },
    ],
  }),
  component: Landing,
});

const badges = [
  { icon: Trophy, label: "412 selections", sub: "since 2009", className: "left-2 top-24 sm:left-8 sm:top-28" },
  { icon: GraduationCap, label: "1:12 mentor ratio", sub: "personal review", className: "right-2 top-40 sm:right-8 sm:top-44" },
  { icon: Sparkles, label: "Answer clinics", sub: "every week", className: "bottom-16 left-4 sm:bottom-20 sm:left-16" },
];

function Landing() {
  const { courses } = useCourses();
  const heroSlides = useHeroSlides();
  const heroRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.45, 0.8]);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // The slides used to advance when their background video ended; now that they
  // are stills, a timer keeps the same rhythm.
  useEffect(() => {
    if (!api) return;

    const timer = setInterval(() => api.scrollNext(), 6500);
    return () => clearInterval(timer);
  }, [api]);

  const activeSlide = heroSlides[current] ?? heroSlides[0]!;

  return (
    <div>
      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden px-4 pt-6 pb-10 sm:px-8 sm:pt-8">
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[34rem] overflow-hidden rounded-[2rem] shadow-float sm:aspect-[20/9] sm:min-h-0 sm:rounded-[2.5rem]"
            style={{ perspective: 1200 }}
          >
            {/* Video & Image Background Carousel */}
            <motion.div
              className="absolute inset-0 h-full w-full"
              style={{ y: imageY, scale: imageScale }}
            >
              <Carousel
                key={heroSlides.map((slide) => slide.id).join("|")}
                setApi={setApi}
                opts={{ loop: true, watchDrag: true }}
                className="h-full w-full"
              >
                <CarouselContent className="ml-0 h-full">
                  {heroSlides.map((slide, index) => (
                    <CarouselItem key={slide.id} className="relative h-full basis-full pl-0">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        width={1600}
                        height={1008}
                        loading={index === 0 ? "eager" : "lazy"}
                        className="h-full w-full object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </motion.div>

            {/* Gradient Overlay */}
            <motion.div
              className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-chocolate via-chocolate/40 to-transparent"
              style={{ opacity: overlayOpacity }}
            />
            {/* Second scrim: the classroom stills are brightest where the
                left-aligned headline sits, so darken that side too. */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-r from-chocolate/75 via-chocolate/30 to-transparent" />

            {/* Dynamic Text Content (Syncs with Active Slide) */}
            <div className="relative z-20 flex h-full flex-col justify-end p-5 pb-6 sm:p-8 lg:p-10">
              <div className="max-w-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/15 px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.18em] text-cream uppercase backdrop-blur-md sm:px-4 sm:text-xs">
                      <Film className="h-3.5 w-3.5" /> {activeSlide.tag}
                    </span>
                    <h1 className="mt-3 text-[1.65rem] leading-[1.15] text-balance text-cream sm:text-5xl lg:text-6xl sm:leading-[1.08]">
                      {activeSlide.title}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm font-semibold leading-snug text-cream/90 text-tamil sm:text-xl">
                      {activeSlide.titleTa}
                    </p>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">
                      {activeSlide.description}
                    </p>
                    <p className="mt-1 hidden max-w-xl text-sm text-cream/75 text-tamil sm:block">
                      {activeSlide.descriptionTa}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    to="/courses"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-gold transition-transform hover:-translate-y-0.5 sm:w-auto sm:justify-start sm:px-7"
                  >
                    <span className="text-center sm:text-left">
                      Explore courses
                      <span className="block text-xs font-medium opacity-90 text-tamil">
                        பாடநெறிகளைப் பாருங்கள்
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/library"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cream/40 bg-cream/10 px-6 py-3 text-sm font-semibold text-cream backdrop-blur-md transition-colors hover:bg-cream/20 sm:w-auto sm:justify-start"
                  >
                    <Play className="h-4 w-4 shrink-0" />
                    <span className="text-center sm:text-left">
                      Watch a class
                      <span className="block text-xs font-medium opacity-90 text-tamil">
                        வகுப்பைப் பாருங்கள்
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Manual Slide Navigation Controls & Indicators */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-3 sm:top-auto sm:right-6 sm:bottom-6">
              <div className="flex gap-1.5">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => api?.scrollTo(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      current === idx ? "w-7 bg-cream" : "w-2 bg-cream/40"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => api?.scrollPrev()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30 bg-cream/15 text-cream backdrop-blur-md transition hover:bg-cream/30"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => api?.scrollNext()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30 bg-cream/15 text-cream backdrop-blur-md transition hover:bg-cream/30"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Floating badges */}
            {badges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.6 + i * 0.15 },
                  scale: { duration: 0.6, delay: 0.6 + i * 0.15 },
                  y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: 0.6 + i * 0.2 },
                }}
                className={`absolute z-20 hidden items-center gap-3 rounded-2xl px-4 py-3 glass-card md:flex ${badge.className}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-gradient text-primary-foreground">
                  <badge.icon className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-chocolate">{badge.label}</span>
                  <span className="block text-xs text-muted-foreground">{badge.sub}</span>
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 pb-20 sm:px-8">
        <Reveal className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["412", "Final selections"],
            ["17", "Years of mentoring"],
            ["1,240+", "Filmed lectures"],
            ["48 hrs", "Answer feedback"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <p className="font-serif text-3xl text-chocolate sm:text-4xl">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Course preview */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>Programmes</Eyebrow>
              <h2 className="mt-4 max-w-xl text-3xl sm:text-5xl">
                Many tracks, one <span className="text-gold-gradient">unhurried</span> method.
              </h2>
              <p className="mt-3 max-w-xl text-base font-semibold text-chocolate text-tamil sm:text-lg">
                பல பாதைகள், ஒரே நிதானமான முறை.
              </p>
            </div>
            <Link
              to="/courses"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold shadow-soft transition-colors hover:bg-secondary"
            >
              View all courses
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {courses.slice(0, 3).map((course, i) => (
              <Reveal key={course.id} delay={i * 0.1}>
                <motion.article
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="h-full overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
                >
                  <div className="aspect-16/10 overflow-hidden">
                    <CourseThumbnail
                      course={course}
                      className="transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      {course.track}
                    </span>
                    <h3 className="mt-2 text-xl">{course.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-chocolate text-tamil">
                      {course.titleTa}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">{course.blurb}</p>
                    <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> {course.duration}
                      </span>
                      <span className="font-semibold text-chocolate">{course.price}</span>
                    </div>
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 sm:px-8">
        <Reveal className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-chocolate px-8 py-16 text-center sm:px-16 sm:py-24">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-gradient opacity-25 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl text-cream sm:text-5xl">
                Your attempt deserves a calmer classroom.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-cream/70">
                Seats for the 2027 foundation batch close on 30 September. Sit in on a live session
                before you decide.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  to="/apply"
                  search={{ course: "" }}
                  className="rounded-full bg-gold-gradient px-8 py-3 text-center text-sm font-semibold text-primary-foreground shadow-gold transition-transform hover:-translate-y-0.5"
                >
                  Apply now
                  <span className="block text-xs font-medium opacity-90 text-tamil">
                    இப்போது விண்ணப்பிக்க
                  </span>
                </Link>
                <Link
                  to="/about"
                  className="rounded-full border border-cream/30 px-7 py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
                >
                  Meet the faculty
                  <span className="block text-xs font-medium opacity-90 text-tamil">
                    ஆசிரியர்களை அறிக
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}