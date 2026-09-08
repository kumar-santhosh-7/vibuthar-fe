import { Clock } from "lucide-react";
import type { Course } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * Branded course poster, drawn in the browser rather than shipped as an image so
 * the Tamil title stays sharp and editable. Every size is in `cqw` (percent of
 * the thumbnail's own width), so one component serves the small apply-page
 * preview and the large course cards without per-placement overrides.
 */
export function CourseThumbnail({ course, className }: { course: Course; className?: string }) {
  if (course.hasThumbnail) {
    return (
      <div className={cn("@container relative h-full w-full overflow-hidden bg-secondary", className)}>
        <img
          src={course.image}
          alt=""
          loading="lazy"
          draggable={false}
          width={1200}
          height={800}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "@container relative isolate h-full w-full overflow-hidden bg-chocolate select-none",
        className,
      )}
    >
      <img
        aria-hidden
        src={course.image}
        alt=""
        loading="lazy"
        draggable={false}
        width={1200}
        height={800}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tr from-chocolate via-chocolate/92 to-chocolate/55"
      />
      <div
        aria-hidden
        className="absolute -top-1/3 -right-1/4 h-[80cqw] w-[80cqw] rounded-full bg-gold/25 blur-[12cqw]"
      />
      <div
        aria-hidden
        className="absolute -bottom-[10cqw] -left-[6cqw] font-serif text-[34cqw] leading-none text-cream/[0.06]"
      >
        {course.titleTa.slice(0, 1)}
      </div>
      <div
        aria-hidden
        className="absolute -top-[14cqw] right-[8cqw] h-[40cqw] w-[40cqw] rounded-full border-[0.6cqw] border-gold/20"
      />

      <div className="relative flex h-full flex-col justify-between p-[5cqw]">
        <div className="flex items-start justify-between gap-[3cqw]">
          <div className="flex items-center gap-[2.4cqw]">
            <span className="flex h-[9cqw] w-[9cqw] items-center justify-center rounded-full bg-gold-gradient font-serif text-[5cqw] leading-none text-chocolate">
              V
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[4.4cqw] tracking-[0.06em] text-cream">
                VIBUTHAR
              </span>
              <span className="mt-[1cqw] text-[2.4cqw] font-semibold tracking-[0.36em] text-gold">
                ACADEMY
              </span>
            </span>
          </div>
          <span className="rounded-full border-[0.3cqw] border-gold/50 px-[2.6cqw] py-[1cqw] text-[2.4cqw] font-semibold tracking-[0.18em] text-gold">
            {course.track.toUpperCase()}
          </span>
        </div>

        <div>
          {/* Not a heading: each card already carries the course title as its
              real heading, and Fraunces' decorative ampersand is unreadable at
              poster size, so this uses the sans stack. */}
          <p className="text-[5.6cqw] leading-[1.12] font-extrabold tracking-[-0.005em] text-cream uppercase">
            {course.title}
          </p>
          <p className="mt-[2.6cqw] inline-block rounded-[1.6cqw] bg-gold-gradient px-[3cqw] py-[1.6cqw] text-[3.4cqw] leading-tight font-semibold text-chocolate text-tamil">
            {course.titleTa}
          </p>
        </div>

        <div className="flex items-end justify-between gap-[3cqw] text-[2.5cqw] font-semibold">
          <span className="inline-flex shrink-0 items-center gap-[1.4cqw] rounded-full bg-cream/12 px-[2.8cqw] py-[1.4cqw] text-cream ring-[0.2cqw] ring-cream/20 ring-inset">
            <Clock className="h-[2.9cqw] w-[2.9cqw] text-gold" />
            {course.duration}
          </span>
          <span className="text-right tracking-[0.1em] text-gold uppercase">{course.tagline}</span>
        </div>
      </div>
    </div>
  );
}
