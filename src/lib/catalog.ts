import { useCallback, useEffect, useMemo, useState } from "react";
import fallbackImage from "@/assets/course-1.jpg";
import type { Course } from "@/data/content";
import {
  createAdminCourse,
  listAdminCourses,
  resolveApiMediaUrl,
  type AdminCourse,
  type CreateAdminCourseInput,
} from "@/lib/api";

export type { Course };

function isActive(course: AdminCourse) {
  const status = course.status.trim().toUpperCase();
  return !status || status === "ACTIVE";
}

export function toUiCourse(course: AdminCourse): Course {
  const hours = course.durationHours;
  const thumbnail = resolveApiMediaUrl(course.thumbnailUrl);
  return {
    id: course.id,
    title: course.title,
    titleTa: course.title,
    shortTitle: course.title,
    track: "Programme",
    duration: hours ? `${hours} hours` : "—",
    lessons: hours || 0,
    price: Number.isFinite(course.price) ? `₹${course.price.toLocaleString("en-IN")}` : "—",
    blurb: course.description,
    blurbTa: course.description,
    tagline: course.status || course.title,
    image: thumbnail || fallbackImage,
    ...(thumbnail ? { hasThumbnail: true } : {}),
  };
}

export function useCourses(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false;
  const [raw, setRaw] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRaw(await listAdminCourses());
      setError("");
    } catch (err) {
      setRaw([]);
      setError(err instanceof Error ? err.message : "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const courses = useMemo(
    () => (includeInactive ? raw : raw.filter(isActive)).map(toUiCourse),
    [includeInactive, raw],
  );

  return { courses, raw, loading, error, reload };
}

export async function addCourse(input: CreateAdminCourseInput) {
  return toUiCourse(await createAdminCourse(input));
}
