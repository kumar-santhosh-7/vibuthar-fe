const TOKEN_KEY = "vibuthar.auth.token";

export function apiBaseUrl() {
  return String(import.meta.env["VITE_API_BASE_URL"] ?? "").replace(/\/$/, "");
}

export function apiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = apiBaseUrl();
  return base ? `${base}${normalized}` : normalized;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, fallback: string) {
  if (typeof body === "string" && body.trim()) return body;
  if (!body || typeof body !== "object") return fallback;
  const value = body as Record<string, unknown>;
  for (const key of ["message", "error", "msg"] as const) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) return item;
  }
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const rec = asRecord(value);
  if (!rec) return [];
  const data = asRecord(rec["data"]);
  if (Array.isArray(data?.["items"])) return data["items"] as unknown[];
  if (Array.isArray(rec["items"])) return rec["items"] as unknown[];
  for (const key of ["data", "content", "members", "users", "items", "results", "list", "courses", "banners", "images"]) {
    const item = rec[key];
    if (Array.isArray(item)) return item;
    const nested = asRecord(item);
    if (!nested) continue;
    for (const inner of [
      "data",
      "content",
      "members",
      "users",
      "items",
      "results",
      "list",
      "subscribed",
      "nonSubscribed",
      "subscribedMembers",
      "nonSubscribedMembers",
      "courses",
      "banners",
      "images",
    ]) {
      if (Array.isArray(nested[inner])) return nested[inner] as unknown[];
    }
  }
  return [];
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const n = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function formatPrefixedId(prefix: string, ...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const text = pickString(value);
    if (!text) continue;
    if (text.toUpperCase().startsWith(prefix)) return text;
    if (/^\d+$/.test(text)) return `${prefix}${text.padStart(6, "0")}`;
    return text;
  }
  return "";
}

function pickCreatedAt(rec: Record<string, unknown>) {
  const raw = rec["createdAt"] ?? rec["created_at"] ?? rec["registeredAt"] ?? rec["joinedAt"] ?? rec["createdOn"];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(raw > 1e12 ? raw : raw * 1000).toISOString();
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "";
}

function pickPaymentType(...values: unknown[]): PaymentType | "" {
  const raw = pickString(...values).toUpperCase().replace(/[-\s]/g, "_");
  if (raw === "UPI") return "UPI";
  if (raw === "CASH") return "CASH";
  return "";
}

function pickPaymentStatus(...values: unknown[]): PaymentStatus | "" {
  const raw = pickString(...values).toUpperCase().replace(/[-\s]/g, "_");
  if (raw === "PAID") return "PAID";
  if (raw === "PARTIAL") return "PARTIAL";
  if (raw === "NOT_PAID" || raw === "UNPAID" || raw === "UN_PAID") return "NOT_PAID";
  return "";
}

function pickEnrollments(rec: Record<string, unknown>): AdminMemberEnrollment[] {
  const subscriptions = rec["subscriptions"];
  const lists =
    Array.isArray(subscriptions) && subscriptions.length > 0
      ? [subscriptions]
      : [
          rec["enrollments"],
          rec["courses"],
          rec["subscribedCourses"],
          rec["paidCourses"],
          rec["coursePayments"],
        ];
  const out: AdminMemberEnrollment[] = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item === "string" && item.trim()) {
        const courseId = formatPrefixedId("CRS", item) || item.trim();
        out.push({ courseId, title: item.trim(), paid: 0 });
        continue;
      }
      const row = asRecord(item);
      if (!row) continue;
      const title = pickString(row["title"], row["courseName"], row["courseTitle"], row["name"], row["shortTitle"]);
      const explicitCourseId = formatPrefixedId("CRS", row["courseId"], row["course_id"]);
      const rowId = pickString(row["id"]);
      const courseId = explicitCourseId || formatPrefixedId("CRS", rowId) || title;
      if (!courseId) continue;
      const paid = pickNumber(row["paid"], row["amount"]);
      const shortTitle = pickString(row["shortTitle"], row["short_title"]);
      const paymentType = pickPaymentType(row["paymentType"], row["payment_type"]);
      const paymentStatus = pickPaymentStatus(row["paymentStatus"], row["payment_status"]);
      const subscriptionId = pickString(row["subscriptionId"], row["subscription_id"]) || (explicitCourseId ? rowId : "");
      const coursePrice = row["coursePrice"] ?? row["course_price"] ?? row["fee"];
      const remaining = row["remainingAmount"] ?? row["remaining_amount"];
      const subscriptionStatus = pickString(row["status"]);
      out.push({
        courseId,
        title: title || courseId,
        paid,
        ...(shortTitle ? { shortTitle } : {}),
        ...(paymentType ? { paymentType } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(subscriptionId ? { subscriptionId } : {}),
        ...(coursePrice !== undefined && coursePrice !== null && coursePrice !== ""
          ? { coursePrice: pickNumber(coursePrice) }
          : {}),
        ...(remaining !== undefined && remaining !== null && remaining !== ""
          ? { remainingAmount: pickNumber(remaining) }
          : {}),
        ...(subscriptionStatus && subscriptionStatus !== paymentStatus
          ? { subscriptionStatus }
          : {}),
      });
    }
  }
  return out;
}

function pickMember(raw: unknown): AdminMember | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const user = asRecord(rec["user"]) ?? rec;
  const phone = pickString(
    user["phone"],
    user["mobile"],
    user["mobileNumber"],
    user["phoneNumber"],
    user["identifier"],
  ).replace(/\D/g, "").slice(-10);
  const studentId = formatPrefixedId(
    "STU",
    user["userId"],
    rec["userId"],
    user["studentId"],
    rec["studentId"],
    user["id"],
    rec["id"],
  );
  const id = studentId || pickString(user["id"], rec["id"], phone);
  const name = pickString(user["name"], user["fullName"], user["username"]) || "Aspirant";
  if (!id && !phone && name === "Aspirant") return null;
  const roleRaw = pickString(user["role"], rec["role"]).toUpperCase();
  const enrollments = pickEnrollments(user);
  const paymentStatus = pickPaymentStatus(user["paymentStatus"], rec["paymentStatus"]);
  const paymentType = pickPaymentType(user["paymentType"], rec["paymentType"]);
  const email = pickString(user["email"], rec["email"]);
  return {
    id: id || phone || name,
    studentId: studentId || id || phone || name,
    name,
    phone: phone || "—",
    role: roleRaw || "STUDENT",
    createdAt: pickCreatedAt(user) || pickCreatedAt(rec),
    enrollments: enrollments.map((row) => ({
      ...row,
      ...(row.paymentStatus ? {} : paymentStatus ? { paymentStatus } : {}),
      ...(row.paymentType ? {} : paymentType ? { paymentType } : {}),
    })),
    ...(email ? { email } : {}),
  };
}

function pickMembers(body: unknown): AdminMember[] {
  return asArray(body)
    .map(pickMember)
    .filter((member): member is AdminMember => Boolean(member));
}

function pickCourse(raw: unknown): AdminCourse | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const course = asRecord(rec["course"]) ?? rec;
  const title = pickString(course["title"], course["name"]);
  const id =
    formatPrefixedId("CRS", course["courseId"], rec["courseId"], course["code"], rec["code"], course["id"], rec["id"]) ||
    title;
  if (!id && !title) return null;
  return {
    id: id || title,
    title: title || "Course",
    description: pickString(course["description"], course["blurb"], course["details"]),
    durationHours: pickNumber(
      course["durationHours"],
      course["duration_hours"],
      course["hours"],
      course["duration"],
    ),
    price: pickNumber(course["price"], course["fee"], course["amount"]),
    status: pickString(course["status"]) || "ACTIVE",
    thumbnailUrl: mediaUrl(pickString(course["thumbnailUrl"], rec["thumbnailUrl"])),
  };
}

function pickCourses(body: unknown): AdminCourse[] {
  return asArray(body)
    .map(pickCourse)
    .filter((course): course is AdminCourse => Boolean(course));
}

function pickBanner(raw: unknown): AdminBanner | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const banner = asRecord(rec["banner"]) ?? rec;
  const title = pickString(banner["title"], banner["name"]);
  const imageUrl = pickString(
    banner["imageUrl"],
    banner["image_url"],
    banner["url"],
    banner["image"],
    banner["thumbnailUrl"],
  );
  const id = pickString(banner["id"], rec["id"], banner["bannerId"], title, imageUrl);
  if (!id && !imageUrl) return null;
  return {
    id: id || imageUrl,
    title: title || "Banner",
    imageUrl,
    status: pickString(banner["status"]) || "ACTIVE",
  };
}

function mediaUrl(path: string) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = apiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export function resolveApiMediaUrl(path: string) {
  return mediaUrl(path);
}

function pickImage(raw: unknown): AdminImage | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const image = asRecord(rec["image"]) ?? rec;
  const url = mediaUrl(
    pickString(
      image["url"],
      image["imageUrl"],
      image["image_url"],
      image["path"],
      image["fileUrl"],
      image["src"],
    ),
  );
  const id = pickString(image["imageId"], rec["imageId"], image["id"], rec["id"], url);
  if (!id && !url) return null;
  return {
    id: id || url,
    url,
    title: pickString(image["title"], image["name"], image["originalName"], image["filename"], image["fileName"]) || "Image",
  };
}

function pickImages(body: unknown): AdminImage[] {
  return asArray(body)
    .map(pickImage)
    .filter((image): image is AdminImage => Boolean(image));
}

function pickBanners(body: unknown): AdminBanner[] {
  return asArray(body)
    .map(pickBanner)
    .filter((banner): banner is AdminBanner => Boolean(banner));
}

function authHeaders(): HeadersInit {
  const token = typeof window === "undefined" ? null : readAuthToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path: string, init: RequestInit, fallbackError: string) {
  const headers = new Headers(authHeaders());
  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  const res = await fetch(apiUrl(path), { cache: "no-store", ...init, headers });
  const body = await readBody(res);
  if (!res.ok) {
    throw new ApiError(errorMessage(body, fallbackError), res.status);
  }
  return body;
}

async function sendForm(path: string, method: "POST" | "PUT" | "PATCH", form: FormData, fallbackError: string) {
  const token = typeof window === "undefined" ? null : readAuthToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(apiUrl(path), {
    method,
    body: form,
    headers,
  });
  const payload = await readBody(res);
  if (!res.ok) {
    throw new ApiError(errorMessage(payload, fallbackError), res.status);
  }
  return payload;
}

async function sendFile(path: string, method: "POST" | "PUT", file: File, fallbackError: string) {
  const form = new FormData();
  form.append("file", file, file.name);
  return sendForm(path, method, form, fallbackError);
}

async function postJson(path: string, payload: unknown, fallbackError: string) {
  return request(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    fallbackError,
  );
}

async function patchJson(path: string, payload: unknown, fallbackError: string) {
  return request(
    path,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    fallbackError,
  );
}

export type MemberListKind = "subscribed" | "non-subscribed";

export type PaymentType = "UPI" | "CASH";
export type PaymentStatus = "PAID" | "NOT_PAID" | "PARTIAL";

export type AdminMemberEnrollment = {
  courseId: string;
  title: string;
  shortTitle?: string;
  paid: number;
  paymentType?: PaymentType;
  paymentStatus?: PaymentStatus;
  subscriptionId?: string;
  coursePrice?: number;
  remainingAmount?: number;
  subscriptionStatus?: string;
};

export type AdminMember = {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  createdAt: string;
  enrollments: AdminMemberEnrollment[];
};

export type AdminCourse = {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  price: number;
  status: string;
  thumbnailUrl: string;
};

export type AdminBanner = {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
};

export type AdminImage = {
  id: string;
  url: string;
  title: string;
};

export type CreateAdminCourseInput = {
  title: string;
  description: string;
  durationHours: number;
  price: number;
  status: string;
  thumbnail: File;
};

export type CreateAdminSubscriptionInput = {
  studentId: string;
  courseId: string;
  expiresAt: string | null;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  amount: number;
};

export type UpdateAdminSubscriptionPaymentInput = {
  subscriptionId: string;
  studentId: string;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  amount: number;
};

export type RegisterRequest = {
  name: string;
  phone: string;
  password: string;
  role?: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
  deviceInfo: string;
};

export type AuthApiUser = {
  name?: string;
  phone?: string;
  role?: string;
  token?: string;
  userId?: string;
  subscribedCourses?: SubscribedCourse[];
};

export type UserProfile = {
  userId: string;
  name: string;
  email: string;
  ugDegree: string;
  pgDegree: string;
  address: string;
  phone: string;
};

export type UpdateUserProfileInput = {
  name: string;
  email: string;
  ugDegree: string;
  pgDegree: string;
  address: string;
};

export type CourseVideo = {
  id: string;
  title: string;
  videoUrl: string;
  sortOrder: number;
  durationMinutes: number;
};

export type SubscribedCourse = {
  courseId: string;
  title: string;
  subscribedAt?: string;
  videos: CourseVideo[];
};

function pickCourseVideos(row: Record<string, unknown>): CourseVideo[] {
  const list = row["videos"];
  if (!Array.isArray(list)) return [];
  const out: CourseVideo[] = [];
  for (const item of list) {
    const video = asRecord(item);
    if (!video) continue;
    const title = pickString(video["title"]);
    const videoUrl = pickString(video["videoUrl"], video["video_url"], video["url"]);
    if (!title && !videoUrl) continue;
    out.push({
      id: pickString(video["id"]) || videoUrl || title,
      title: title || "Lecture",
      videoUrl,
      sortOrder: pickNumber(video["sortOrder"], video["sort_order"]) ?? 0,
      durationMinutes: pickNumber(video["durationMinutes"], video["duration_minutes"]) ?? 0,
    });
  }
  return out.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function pickSubscribedCourses(user: Record<string, unknown>): SubscribedCourse[] {
  const list = user["subscribedCourses"];
  if (!Array.isArray(list)) return [];
  const out: SubscribedCourse[] = [];
  for (const item of list) {
    const row = asRecord(item);
    if (!row) continue;
    const courseId = pickString(row["courseId"], row["course_id"], row["id"]);
    const title = pickString(row["title"], row["courseTitle"], row["name"], courseId);
    if (!courseId && !title) continue;
    out.push({
      courseId: courseId || title,
      title: title || courseId,
      videos: pickCourseVideos(row),
      ...(pickString(row["subscribedAt"]) ? { subscribedAt: pickString(row["subscribedAt"]) } : {}),
    });
  }
  return out;
}

function pickUserProfile(body: unknown): UserProfile {
  const root = asRecord(body);
  const data = asRecord(root?.["data"]) ?? root;
  const user = asRecord(data?.["user"]) ?? data ?? {};
  return {
    userId: pickString(user["userId"], data?.["userId"], user["id"], data?.["id"]),
    name: pickString(user["name"], data?.["name"]),
    email: pickString(user["email"], data?.["email"]),
    ugDegree: pickString(user["ugDegree"], user["ug_degree"], data?.["ugDegree"], data?.["ug_degree"]),
    pgDegree: pickString(user["pgDegree"], user["pg_degree"], data?.["pgDegree"], data?.["pg_degree"]),
    address: pickString(user["address"], data?.["address"]),
    phone: pickString(user["phone"], data?.["phone"]).replace(/\D/g, "").slice(-10),
  };
}

export async function getUserProfile() {
  const body = await request("/api/users/profile", { method: "GET" }, "Could not load your profile.");
  return pickUserProfile(body);
}

export async function updateUserProfile(userId: string, input: UpdateUserProfileInput) {
  const body = await request(
    `/api/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        ugDegree: input.ugDegree,
        pgDegree: input.pgDegree,
        address: input.address,
      }),
    },
    "Could not update your profile.",
  );
  const next = pickUserProfile(body);
  return {
    userId: next.userId || userId,
    name: next.name || input.name,
    email: next.email || input.email,
    ugDegree: next.ugDegree || input.ugDegree,
    pgDegree: next.pgDegree || input.pgDegree,
    address: next.address || input.address,
    phone: next.phone,
  };
}

export function pickAuthUser(body: unknown): AuthApiUser {
  const root = asRecord(body);
  const data = asRecord(root?.["data"]) ?? root;
  const user = asRecord(data?.["user"]) ?? data;
  if (!user) return {};

  const tokenValue = data?.["token"] ?? data?.["accessToken"] ?? root?.["token"] ?? root?.["accessToken"];
  const name = user["name"];
  const phone = user["phone"];
  const role = user["role"];
  const userId = pickString(user["userId"], data?.["userId"], user["id"]);
  const subscribedCourses = pickSubscribedCourses(user);

  return {
    ...(typeof name === "string" ? { name } : {}),
    ...(typeof phone === "string" ? { phone } : {}),
    ...(typeof role === "string" ? { role } : {}),
    ...(typeof tokenValue === "string" ? { token: tokenValue } : {}),
    ...(userId ? { userId } : {}),
    ...(subscribedCourses.length ? { subscribedCourses } : {}),
  };
}

export function readAuthToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAuthToken(token?: string) {
  if (!token) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function deviceInfo() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X|Macintosh/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown";
  return `${browser} on ${os}`;
}

async function postAuthJson(path: string, payload: unknown, fallbackError: string) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await readBody(res);
  if (!res.ok) {
    throw new ApiError(errorMessage(body, fallbackError), res.status);
  }
  return body;
}

async function postAuth(path: string, payload: unknown, fallbackError: string) {
  return pickAuthUser(await postAuthJson(path, payload, fallbackError));
}

export async function registerAccount(payload: RegisterRequest) {
  return postAuth(
    "/api/auth/register",
    {
      name: payload.name,
      phone: payload.phone,
      password: payload.password,
      ...(payload.role ? { role: payload.role } : {}),
    },
    "Could not create this account.",
  );
}

export async function loginAccount(payload: LoginRequest) {
  return postAuth("/api/auth/login", payload, "Could not sign in with these details.");
}

export async function forgotPassword(phone: string) {
  await postAuthJson("/api/auth/forgot-password", { phone }, "Could not start password reset.");
}

export async function resetPassword(phone: string, newPassword: string) {
  await postAuthJson(
    "/api/auth/reset-password",
    { phone, newPassword },
    "Could not reset this password.",
  );
}

export async function listAdminSubscriptionStats() {
  const body = await request(
    "/api/admin/subscriptions/stats",
    { method: "GET" },
    "Could not load subscription stats.",
  );
  const root = asRecord(body);
  const data = asRecord(root?.["data"]) ?? root ?? {};
  return {
    courseCount: pickNumber(data["courseCount"], data["course_count"]),
    subscribedMemberCount: pickNumber(
      data["subscribedMemberCount"],
      data["subscribed_member_count"],
    ),
    unsubscribedMemberCount: pickNumber(
      data["unsubscribedMemberCount"],
      data["unsubscribed_member_count"],
    ),
  };
}

export async function listAdminPaidAmount() {
  const body = await request(
    "/api/admin/subscriptions/paid-amount",
    { method: "GET" },
    "Could not load paid amount.",
  );
  const root = asRecord(body);
  const data = asRecord(root?.["data"]) ?? root ?? {};
  return pickNumber(data["totalPaidAmount"], data["total_paid_amount"]);
}

export async function listAdminMembers(kind: MemberListKind) {
  const path =
    kind === "subscribed" ? "/api/admin/members/subscribed" : "/api/admin/members/non-subscribed";
  const body = await request(
    `${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`,
    { method: "GET" },
    "Could not load members.",
  );
  return pickMembers(body);
}

export async function listAdminCourses() {
  const body = await request("/api/admin/courses", { method: "GET" }, "Could not load courses.");
  return pickCourses(body);
}

export async function createAdminCourse(input: CreateAdminCourseInput) {
  const form = new FormData();
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("durationHours", String(input.durationHours));
  form.append("price", input.price.toFixed(2));
  form.append("status", input.status);
  const thumbnail =
    input.thumbnail.type
      ? input.thumbnail
      : new File([input.thumbnail], input.thumbnail.name, { type: "image/jpeg" });
  form.append("thumbnail", thumbnail, thumbnail.name);
  const body = await sendForm("/api/admin/courses", "POST", form, "Could not create this course.");
  const rec = asRecord(body);
  const nested = rec ? (asRecord(rec["data"]) ?? rec) : body;
  return (
    pickCourse(nested) ??
    pickCourses(body)[0] ?? {
      id: pickString(asRecord(nested)?.["id"], input.title) || input.title,
      title: input.title,
      description: input.description,
      durationHours: input.durationHours,
      price: input.price,
      status: input.status,
      thumbnailUrl: mediaUrl(pickString(asRecord(nested)?.["thumbnailUrl"])),
    }
  );
}

export async function createAdminSubscription(input: CreateAdminSubscriptionInput) {
  return postJson(
    "/api/admin/subscriptions",
    {
      studentId: input.studentId,
      courseId: input.courseId,
      expiresAt: input.expiresAt,
      paymentType: input.paymentType,
      paymentStatus: input.paymentStatus,
      amount: input.amount,
    },
    "Could not add this subscription.",
  );
}

export async function updateAdminSubscriptionPayment(input: UpdateAdminSubscriptionPaymentInput) {
  return patchJson(
    `/api/admin/subscriptions/${encodeURIComponent(input.subscriptionId)}/payment`,
    {
      studentId: input.studentId,
      paymentType: input.paymentType,
      paymentStatus: input.paymentStatus,
      amount: input.amount,
    },
    "Could not update this payment.",
  );
}

export type CreateAdminCourseVideoInput = {
  courseId: string;
  title: string;
  videoUrl: string;
  sortOrder: number;
  durationMinutes: number;
};

export async function createAdminCourseVideo(input: CreateAdminCourseVideoInput) {
  return postJson(
    `/api/admin/courses/${encodeURIComponent(input.courseId)}/videos`,
    {
      title: input.title,
      videoUrl: input.videoUrl,
      sortOrder: input.sortOrder,
      durationMinutes: input.durationMinutes,
    },
    "Could not add this video.",
  );
}

export async function listAdminBanners() {
  const body = await request("/api/admin/banners", { method: "GET" }, "Could not load banners.");
  return pickBanners(body);
}

export async function createAdminBanner(input: { title: string; imageUrl: string; status: string }) {
  const body = await postJson(
    "/api/admin/banners",
    {
      title: input.title,
      imageUrl: input.imageUrl,
      status: input.status,
    },
    "Could not add this banner.",
  );
  const rec = asRecord(body);
  const nested = rec ? (asRecord(rec["data"]) ?? rec) : body;
  return (
    pickBanner(nested) ??
    pickBanners(body)[0] ?? {
      id: pickString(asRecord(nested)?.["id"], input.title) || input.title,
      title: input.title,
      imageUrl: input.imageUrl,
      status: input.status,
    }
  );
}

function imageFromUpload(body: unknown, file: File): AdminImage {
  const rec = asRecord(body);
  const nested = rec ? (asRecord(rec["data"]) ?? rec) : body;
  return (
    pickImage(nested) ??
    pickImages(body)[0] ?? {
      id: pickString(asRecord(nested)?.["id"], asRecord(nested)?.["imageId"], file.name) || file.name,
      url: "",
      title: file.name,
    }
  );
}

export async function listPublicImages() {
  const body = await request("/api/images", { method: "GET" }, "Could not load images.");
  return pickImages(body);
}

export async function uploadAdminImage(file: File) {
  const body = await sendFile("/api/admin/images", "POST", file, "Could not upload this image.");
  return imageFromUpload(body, file);
}

export async function updateAdminImage(imageId: string, file: File) {
  const body = await sendFile(
    `/api/admin/images/${encodeURIComponent(imageId)}`,
    "PUT",
    file,
    "Could not replace this image.",
  );
  return imageFromUpload(body, file);
}

export async function deleteAdminImage(imageId: string) {
  await request(
    `/api/admin/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" },
    "Could not delete this image.",
  );
}
