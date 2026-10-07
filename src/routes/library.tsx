import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Lock, Maximize2, Minimize2, Play, Search, LayoutGrid, X, Youtube } from "lucide-react";
import { useAuth, type User } from "@/lib/auth";
import { type CourseVideo, type SubscribedCourse } from "@/lib/api";
import {
  formatLectureDuration,
  youtubeChannelUrl,
  youtubeEmbed,
  youtubeIdFromUrl,
  youtubeThumb,
} from "@/data/content";
import { cn } from "@/lib/utils";

type LibraryVideo = {
  key: string;
  youtubeId: string;
  title: string;
  courseId: string;
  courseTitle: string;
  duration: string;
  videoUrl: string;
};

function toLibraryVideo(course: SubscribedCourse, video: CourseVideo): LibraryVideo | null {
  const youtubeId = youtubeIdFromUrl(video.videoUrl);
  if (!youtubeId && !video.videoUrl) return null;
  return {
    key: `${course.courseId}-${video.id}`,
    youtubeId,
    title: video.title,
    courseId: course.courseId,
    courseTitle: course.title,
    duration: formatLectureDuration(video.durationMinutes),
    videoUrl: video.videoUrl,
  };
}

function lecturesFor(subscribed: SubscribedCourse[]) {
  return subscribed.flatMap((course) =>
    (course.videos ?? [])
      .map((video) => toLibraryVideo(course, video))
      .filter((video): video is LibraryVideo => video !== null),
  );
}

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Video Library | Vibuthar Academy" },
      {
        name: "description",
        content:
          "The Vibuthar on-demand video library: TNPSC Group II, II-A and IV, TN TET and TNUSRB Police classes with answer key explanations.",
      },
      { property: "og:title", content: "Video Library | Vibuthar Academy" },
      {
        property: "og:description",
        content: "TNPSC, TET and Police classes on demand for Vibuthar students.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user, ready } = useAuth();

  if (!ready) return <div className="min-h-[60vh]" />;
  if (!user) return <LockedState />;
  return <Library user={user} />;
}

function LockedState() {
  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] items-center justify-center px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-float"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient text-primary-foreground shadow-gold">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-6 text-3xl">Members only</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The video library is open to enrolled aspirants. Sign in to continue where you left off.
        </p>
        <Link
          to="/login"
          className="mt-7 inline-flex rounded-full bg-gold-gradient px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-gold transition-transform hover:-translate-y-0.5"
        >
          Sign in
        </Link>
      </motion.div>
    </div>
  );
}

const ALL = "all";

function Library({ user }: { user: User }) {
  const subscribed = user.subscribedCourses ?? [];
  const lectures = lecturesFor(subscribed);
  const tabs = [
    { id: ALL, label: "All lectures", labelTa: "அனைத்து வகுப்புகள்" },
    ...subscribed.map((course) => ({
      id: course.courseId,
      label: course.title,
      labelTa: "",
    })),
  ];
  const countFor = (tabId: string) =>
    tabId === ALL ? lectures.length : lectures.filter((v) => v.courseId === tabId).length;
  const [tab, setTab] = useState(ALL);
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<LibraryVideo | null>(null);

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0]!;
  const list = lectures.filter(
    (v) =>
      (tab === ALL || v.courseId === tab) &&
      v.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            <h1 className="mt-1 text-3xl sm:text-4xl">{activeTab.label}</h1>
            {activeTab.labelTa ? (
              <p className="mt-1 text-sm text-muted-foreground text-tamil">{activeTab.labelTa}</p>
            ) : null}
          </div>
          <a
            href={youtubeChannelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full bg-chocolate px-5 py-3 text-sm font-semibold text-cream transition-opacity hover:opacity-90 sm:self-auto"
          >
            <Youtube className="h-4 w-4" /> Our YouTube channel
          </a>
        </motion.div>

        {/* One tab per course, always visible */}
        <div className="mt-7 -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                tab === item.id
                  ? "border-transparent bg-gold-gradient text-primary-foreground shadow-gold"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {item.id === ALL && <LayoutGrid className="h-4 w-4" />}
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  tab === item.id ? "bg-cream/25" : "bg-secondary",
                )}
              >
                {countFor(item.id)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3 shadow-soft focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lectures"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((video, i) => (
              <motion.article
                key={video.key}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                whileHover={{ y: -6 }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
              >
                <button
                  onClick={() => setPlaying(video)}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-label={`Play ${video.title}`}
                  className="relative aspect-16/9 overflow-hidden"
                >
                  {video.youtubeId ? (
                    <img
                      src={youtubeThumb(video.youtubeId)}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      width={480}
                      height={360}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-chocolate/70 to-transparent opacity-70" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-13 w-13 items-center justify-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold transition-all duration-300 group-hover:scale-110">
                      <Play className="h-5 w-5" />
                    </span>
                  </span>
                  {video.duration ? (
                    <span className="absolute right-3 bottom-3 rounded-full bg-chocolate/80 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-md">
                      {video.duration}
                    </span>
                  ) : null}
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {video.courseTitle}
                  </span>
                  <h2 className="mt-2 flex-1 text-base leading-snug font-semibold">{video.title}</h2>
                  <button
                    onClick={() => setPlaying(video)}
                    className="mt-4 inline-flex items-center gap-2 self-start text-sm font-semibold text-chocolate underline-offset-4 hover:underline"
                  >
                    <Play className="h-3.5 w-3.5" /> Watch now
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {list.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            {subscribed.length === 0
              ? "No subscribed courses yet. Lectures appear here after a mentor assigns a programme."
              : query
                ? "No lectures match that search yet."
                : "No lectures have been added to this course yet."}
          </p>
        )}
      </div>

      <VideoPlayer video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}

function nativeFullscreenElement() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function exitNativeFullscreen() {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
  if (!nativeFullscreenElement()) return;
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  await doc.webkitExitFullscreen?.();
}

function VideoPlayer({ video, onClose }: { video: LibraryVideo | null; onClose: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [fullMode, setFullMode] = useState(false);

  useEffect(() => {
    if (!video) {
      setFullMode(false);
      void exitNativeFullscreen();
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (fullMode) {
        e.preventDefault();
        void exitNativeFullscreen();
        setFullMode(false);
        return;
      }
      onClose();
    };
    const onFs = () => {
      if (nativeFullscreenElement()) setFullMode(true);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
      document.body.style.overflow = "";
    };
  }, [video, onClose, fullMode]);

  async function toggleFullMode() {
    const el = stageRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    if (!el) return;

    if (fullMode) {
      await exitNativeFullscreen();
      setFullMode(false);
      return;
    }

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        setFullMode(true);
        return;
      }
      if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
        setFullMode(true);
        return;
      }
    } catch {
      // iOS and some Android WebViews block element fullscreen; use in-page full mode.
    }
    setFullMode((open) => !open);
  }

  async function closePlayer() {
    await exitNativeFullscreen();
    setFullMode(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePlayer}
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
          className={cn(
            "fixed inset-0 z-100 flex items-center justify-center",
            fullMode ? "bg-black p-0" : "bg-chocolate/80 p-4 backdrop-blur-sm sm:p-8",
          )}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className={cn(
              "relative overflow-hidden select-none",
              fullMode
                ? "flex h-dvh w-dvw max-w-none flex-col rounded-none bg-black"
                : "w-full max-w-4xl rounded-3xl bg-card shadow-float",
            )}
          >
            <div
              ref={stageRef}
              className={cn(
                "relative overflow-hidden bg-transparent",
                fullMode ? "min-h-0 flex-1" : "aspect-video w-full",
              )}
            >
              <iframe
                key={video.key}
                src={video.youtubeId ? youtubeEmbed(video.youtubeId) : video.videoUrl}
                title={video.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                className="pointer-events-auto h-full w-full"
              />
              {fullMode ? (
                <button
                  type="button"
                  onClick={closePlayer}
                  aria-label="Close player"
                  className="absolute top-3 left-3 z-30 bg-transparent p-2 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={toggleFullMode}
                aria-label={fullMode ? "Exit full screen" : "Watch in full screen"}
                className="absolute right-3 bottom-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/90 bg-black/30 text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-sm"
              >
                {fullMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </div>
            {!fullMode ? (
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <h2 className="text-base leading-snug font-semibold">{video.title}</h2>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    For enrolled Vibuthar students only. Please do not share or re-upload.
                  </p>
                </div>
                <button
                  onClick={closePlayer}
                  aria-label="Close player"
                  className="shrink-0 rounded-full border border-border p-2 transition-colors hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
