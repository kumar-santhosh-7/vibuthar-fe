import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Image as ImageIcon, BarChart3, BookOpen, ChevronLeft, ChevronRight, Eye, ImagePlus, Pencil, Plus, Trash2, Users, Video, X } from "lucide-react";
import { BANNER_IMAGE, assertBannerFile } from "@/lib/banner-image";
import { addCourse, useCourses } from "@/lib/catalog";
import { formatPrice, useUsers } from "@/lib/directory";
import { createAdminCourseVideo, createAdminSubscription, deleteAdminImage, listAdminMembers, listPublicImages, registerAccount, updateAdminImage, updateAdminSubscriptionPayment, uploadAdminImage, type AdminCourse, type AdminImage, type AdminMember, type MemberListKind, type PaymentStatus, type PaymentType } from "@/lib/api";
import { homeFor, isValidPhone, normalizePhone, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fieldClass =
  "w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const PAGE_SIZE = 10;

function usePaged<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);

  useEffect(() => {
    if (page !== current) setPage(current);
  }, [page, current]);

  const start = (current - 1) * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);

  return {
    page: current,
    setPage,
    pageCount,
    slice,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + PAGE_SIZE, items.length),
    total: items.length,
  };
}

function TablePager({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
      <p className="text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            className={cn(
              "h-9 min-w-9 rounded-full px-2 text-sm font-semibold",
              n === page
                ? "bg-gold-gradient text-primary-foreground shadow-gold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin desk | Vibuthar Academy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (user.role !== "admin") navigate({ to: homeFor(user), replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user || user.role !== "admin") {
    return <div className="min-h-[60vh]" />;
  }

  return <AdminDesk />;
}

type AdminSection = "analytics" | "users" | "courses" | "banners";

const sidebar = [
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
  { id: "users" as const, label: "User list", icon: Users },
  { id: "courses" as const, label: "Course list", icon: BookOpen },
  { id: "banners" as const, label: "Banner image", icon: ImageIcon },
];

function AdminDesk() {
  const [section, setSection] = useState<AdminSection>("analytics");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8.5rem)] max-w-7xl flex-col md:flex-row">
      <aside className="border-b border-border bg-sidebar md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="px-5 py-5 md:px-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Admin
          </p>
          <p className="mt-1 font-serif text-xl text-chocolate">Desk</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:flex-col md:px-3 md:pb-6">
          {sidebar.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors md:w-full",
                section === item.id
                  ? "bg-gold-gradient text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 px-5 py-8 sm:px-8">
        {section === "analytics" ? (
          <AnalyticsPanel />
        ) : section === "users" ? (
          <UserPanel />
        ) : section === "courses" ? (
          <CoursePanel />
        ) : (
          <BannerPanel />
        )}
      </div>
    </div>
  );
}

function AdminModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-chocolate/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-float sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id={titleId} className="font-serif text-2xl text-chocolate">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const users = useUsers();
  const { courses } = useCourses({ includeInactive: true });
  const students = users.filter((u) => u.role === "student");
  const allPaid = students.reduce(
    (sum, user) => sum + user.enrollments.reduce((n, e) => n + e.paid, 0),
    0,
  );
  const unassigned = students.filter((u) => u.enrollments.length === 0).length;

  const byCourse = courses.map((course) => {
    const enrolled = students.filter((u) => u.enrollments.some((e) => e.courseId === course.id));
    const collected = enrolled.reduce((sum, user) => {
      const row = user.enrollments.find((e) => e.courseId === course.id);
      return sum + (row?.paid ?? 0);
    }, 0);
    return { course, count: enrolled.length, collected };
  });

  return (
    <div>
      <h2 className="text-2xl">Analytics</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        How many users you have, and how they sit across each course.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Total users
          </p>
          <p className="mt-3 font-serif text-4xl text-chocolate">{users.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{students.length} students</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Fees collected
          </p>
          <p className="mt-3 font-serif text-4xl text-chocolate">{formatPrice(allPaid)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Across all enrolments</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            No course yet
          </p>
          <p className="mt-3 font-serif text-4xl text-chocolate">{unassigned}</p>
          <p className="mt-1 text-sm text-muted-foreground">Students with no enrolment</p>
        </div>
      </div>

      <h3 className="mt-10 text-xl">Users by course</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {byCourse.map(({ course, count, collected }) => (
          <article key={course.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {course.track}
            </p>
            <h4 className="mt-2 text-lg leading-snug">{course.title}</h4>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-serif text-3xl text-chocolate">{count}</p>
                <p className="text-sm text-muted-foreground">{count === 1 ? "user" : "users"}</p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(collected)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function toExpiresAt(value: string) {
  if (!value) return "";
  return value.length === 16 ? `${value}:59` : value;
}

function memberCoursesLabel(user: AdminMember) {
  const titles = user.enrollments.map((row) => row.title).filter(Boolean);
  return titles.length ? titles.join(", ") : "—";
}

function paymentStatusLabel(status: PaymentStatus | string | undefined) {
  if (status === "PAID") return "Paid";
  if (status === "PARTIAL") return "Partial";
  if (status === "NOT_PAID") return "Un-paid";
  return "—";
}

function memberPaymentStatuses(user: AdminMember) {
  const fromEnrollments = user.enrollments
    .map((row) => row.paymentStatus)
    .filter((status): status is PaymentStatus => Boolean(status));
  if (fromEnrollments.length) return [...new Set(fromEnrollments)];
  if (user.enrollments.some((row) => row.paid > 0)) return ["PAID" as const];
  return [];
}

function UserPanel() {
  const [tab, setTab] = useState<MemberListKind>("subscribed");
  const [subscribed, setSubscribed] = useState<AdminMember[]>([]);
  const [unsubscribed, setUnsubscribed] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const members = tab === "subscribed" ? subscribed : unsubscribed;
  const { page, setPage, pageCount, slice, from, to, total } = usePaged(members);
  const { raw: adminCourses } = useCourses({ includeInactive: true });
  const assignableCourses = adminCourses.filter((course) => {
    const status = course.status.trim().toUpperCase();
    return !status || status === "ACTIVE";
  });
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<AdminMember | null>(null);
  const [subscribing, setSubscribing] = useState<AdminMember | null>(null);
  const [updating, setUpdating] = useState<AdminMember | null>(null);
  const [subscriptionId, setSubscriptionId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("NOT_PAID");
  const [amount, setAmount] = useState("");
  const [subError, setSubError] = useState("");
  const [subPending, setSubPending] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [addPending, setAddPending] = useState(false);

  const loadMembers = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
      setLoadError("");
    }
    try {
      const [nextSubscribed, nextUnsubscribed] = await Promise.all([
        listAdminMembers("subscribed"),
        listAdminMembers("non-subscribed"),
      ]);
      setSubscribed(nextSubscribed);
      setUnsubscribed(nextUnsubscribed);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load members.");
      if (!opts?.silent) {
        setSubscribed([]);
        setUnsubscribed([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    setPage(1);
  }, [tab, setPage]);

  function resetForm() {
    setName("");
    setPhone("");
    setPassword("");
    setRole("STUDENT");
    setError("");
  }

  function applyEnrollmentPayment(enrollment: AdminMember["enrollments"][number] | undefined) {
    setPaymentType(enrollment?.paymentType ?? "UPI");
    setPaymentStatus(enrollment?.paymentStatus ?? "NOT_PAID");
    const nextAmount =
      enrollment && enrollment.paid > 0
        ? enrollment.paid
        : enrollment?.remainingAmount ?? enrollment?.coursePrice;
    setAmount(nextAmount !== undefined && Number.isFinite(nextAmount) ? String(nextAmount) : "");
  }

  function openSubscribe(user: AdminMember) {
    const firstCourse = assignableCourses[0];
    setSubscribing(user);
    setCourseId(firstCourse?.id ?? "");
    setExpiresAt("");
    setPaymentType("CASH");
    setPaymentStatus("NOT_PAID");
    setAmount(firstCourse && Number.isFinite(firstCourse.price) ? String(firstCourse.price) : "");
    setSubError("");
  }

  function closeSubscribe() {
    setSubscribing(null);
    setCourseId("");
    setExpiresAt("");
    setPaymentType("CASH");
    setPaymentStatus("NOT_PAID");
    setAmount("");
    setSubError("");
    setSubPending(false);
  }

  function openUpdatePayment(user: AdminMember) {
    const first = user.enrollments.find((row) => row.subscriptionId) ?? user.enrollments[0];
    setUpdating(user);
    setSubscriptionId(first?.subscriptionId ?? "");
    applyEnrollmentPayment(first);
    setSubError("");
  }

  function closeUpdatePayment() {
    setUpdating(null);
    setSubscriptionId("");
    setPaymentType("UPI");
    setPaymentStatus("NOT_PAID");
    setAmount("");
    setSubError("");
    setSubPending(false);
  }

  async function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!subscribing) return;
    if (!courseId) {
      setSubError("Choose a course.");
      return;
    }
    const paidAmount = Number(amount);
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      setSubError("Enter a valid amount.");
      return;
    }
    setSubError("");
    setSubPending(true);
    try {
      await createAdminSubscription({
        studentId: subscribing.studentId,
        courseId,
        expiresAt: expiresAt ? toExpiresAt(expiresAt) : null,
        paymentType,
        paymentStatus,
        amount: Number(paidAmount.toFixed(2)),
      });
      toast.success("Subscription added successfully.");
      closeSubscribe();
      await loadMembers({ silent: true });
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Could not add this subscription.");
    } finally {
      setSubPending(false);
    }
  }

  async function onUpdatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!updating) return;
    if (!subscriptionId) {
      setSubError("This member has no subscription id, so payment cannot be updated.");
      return;
    }
    const paidAmount = Number(amount);
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      setSubError("Enter a valid amount.");
      return;
    }
    setSubError("");
    setSubPending(true);
    try {
      await updateAdminSubscriptionPayment({
        subscriptionId,
        paymentType,
        paymentStatus,
        amount: Number(paidAmount.toFixed(2)),
      });
      toast.success("Payment updated successfully.");
      closeUpdatePayment();
      await loadMembers({ silent: true });
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Could not update this payment.");
    } finally {
      setSubPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Enter the student's name.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setError("");
    setAddPending(true);
    try {
      await registerAccount({
        name: name.trim(),
        phone: normalizePhone(phone),
        password,
        role,
      });
      toast.success("User added successfully.");
      resetForm();
      setOpen(false);
      setTab("non-subscribed");
      setPage(1);
      await loadMembers({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this user.");
    } finally {
      setAddPending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h2 className="text-xl">User list</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading accounts…" : `${subscribed.length + unsubscribed.length} accounts`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold"
        >
          <Plus className="h-4 w-4" /> Add user
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border px-6 py-3">
        {(
          [
            { id: "subscribed" as const, label: "Subscribed", count: subscribed.length },
            { id: "non-subscribed" as const, label: "Non subscribed", count: unsubscribed.length },
          ]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-gold-gradient text-primary-foreground shadow-gold"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                tab === item.id ? "bg-primary-foreground/20" : "bg-background/80",
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-border bg-secondary/60 text-xs tracking-[0.12em] text-muted-foreground uppercase">
            <tr>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Mobile</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              {tab === "non-subscribed" ? (
                <th className="px-6 py-3 font-semibold">Course</th>
              ) : (
                <>
                  <th className="px-6 py-3 font-semibold">Payment</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                </>
              )}
              <th className="px-6 py-3 font-semibold">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={tab === "non-subscribed" ? 5 : 6} className="px-6 py-10 text-center text-muted-foreground">
                  Loading members…
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={tab === "non-subscribed" ? 5 : 6} className="px-6 py-10 text-center text-destructive">
                  {loadError}
                </td>
              </tr>
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={tab === "non-subscribed" ? 5 : 6} className="px-6 py-10 text-center text-muted-foreground">
                  {tab === "subscribed"
                    ? "No subscribed users yet."
                    : "No non-subscribed users yet."}
                </td>
              </tr>
            ) : (
              slice.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/40">
                  <td className="px-6 py-4 font-semibold text-chocolate">{user.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.phone}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                      {user.role}
                    </span>
                  </td>
                  {tab === "non-subscribed" ? (
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">{memberCoursesLabel(user)}</span>
                        <button
                          type="button"
                          onClick={() => openSubscribe(user)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-chocolate transition-colors hover:bg-secondary"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add course
                        </button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {memberPaymentStatuses(user).length ? (
                            memberPaymentStatuses(user).map((status) => (
                              <span
                                key={status}
                                className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide"
                              >
                                {paymentStatusLabel(status)}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => openUpdatePayment(user)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-chocolate transition-colors hover:bg-secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Update payment
                        </button>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setViewing(user)}
                      className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-chocolate"
                      aria-label={`View courses for ${user.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        page={page}
        pageCount={pageCount}
        from={from}
        to={to}
        total={total}
        onPage={setPage}
      />

      <AdminModal
        open={open}
        title="Add user"
        onClose={() => {
          resetForm();
          setOpen(false);
        }}
      >
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="block text-sm font-medium">
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(fieldClass, "mt-2")}
              placeholder="Student name"
            />
          </label>
          <label className="block text-sm font-medium">
            Mobile number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="numeric"
              className={cn(fieldClass, "mt-2")}
              placeholder="Enter 10 digit mobile number"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              className={cn(fieldClass, "mt-2")}
              placeholder="yahya@12345"
            />
          </label>
          <label className="block text-sm font-medium">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={cn(fieldClass, "mt-2")}
            >
              <option value="STUDENT">Student</option>
              <option value="TRAINER">Trainer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={addPending}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:pointer-events-none disabled:opacity-60"
          >
            {addPending ? "Saving…" : "Save user"}
          </button>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(subscribing)}
        title="Add course"
        onClose={closeSubscribe}
      >
        {subscribing && (
          <form onSubmit={onSubscribe} className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Add a subscription for{" "}
              <span className="font-semibold text-chocolate">{subscribing.name}</span>
              {subscribing.studentId ? ` (${subscribing.studentId})` : ""}.
            </p>
            <label className="block text-sm font-medium">
              Course
              <select
                value={courseId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setCourseId(nextId);
                  const selected = assignableCourses.find((course) => course.id === nextId);
                  if (selected && Number.isFinite(selected.price)) {
                    setAmount(String(selected.price));
                  }
                }}
                className={cn(fieldClass, "mt-2")}
              >
                <option value="">Select a course</option>
                {assignableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Payment type
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className={cn(fieldClass, "mt-2")}
              >
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Payment status
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className={cn(fieldClass, "mt-2")}
              >
                <option value="PAID">Paid</option>
                <option value="NOT_PAID">Un-paid</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Amount
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(fieldClass, "mt-2")}
                placeholder="5000"
              />
            </label>
            <label className="block text-sm font-medium">
              Expires at
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={cn(fieldClass, "mt-2")}
              />
            </label>
            {assignableCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active courses are available yet.</p>
            ) : null}
            {subError && <p className="text-sm text-destructive">{subError}</p>}
            <button
              type="submit"
              disabled={subPending || !courseId}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:pointer-events-none disabled:opacity-60"
            >
              {subPending ? "Adding…" : "Add subscription"}
            </button>
          </form>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(updating)}
        title="Update payment"
        onClose={closeUpdatePayment}
      >
        {updating && (
          <form onSubmit={(e) => void onUpdatePayment(e)} className="grid gap-4">
            <label className="block text-sm font-medium">
              Payment type
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className={cn(fieldClass, "mt-2")}
              >
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Amount
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(fieldClass, "mt-2")}
                placeholder="5000"
              />
            </label>
            <label className="block text-sm font-medium">
              Payment status
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className={cn(fieldClass, "mt-2")}
              >
                <option value="PAID">Paid</option>
                <option value="NOT_PAID">Un-paid</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </label>
            {subError && <p className="text-sm text-destructive">{subError}</p>}
            <button
              type="submit"
              disabled={subPending || !subscriptionId}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:pointer-events-none disabled:opacity-60"
            >
              {subPending ? "Saving…" : "Update payment"}
            </button>
          </form>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(viewing)}
        title={viewing ? viewing.name : "User courses"}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <div>
            <p className="text-sm text-muted-foreground">{viewing.phone}</p>
            {viewing.email ? <p className="mt-1 text-sm text-muted-foreground">{viewing.email}</p> : null}
            {viewing.studentId ? (
              <p className="mt-1 text-xs text-muted-foreground">{viewing.studentId}</p>
            ) : null}
            {viewing.enrollments.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                {tab === "subscribed"
                  ? "This member is subscribed. Course details were not returned by the server."
                  : "This user has not paid for a course yet."}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {viewing.enrollments.map((row) => (
                    <article
                      key={row.subscriptionId || row.courseId}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <p className="font-semibold text-chocolate">{row.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{row.courseId}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Payment status</dt>
                          <dd className="font-medium">{paymentStatusLabel(row.paymentStatus)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Payment type</dt>
                          <dd className="font-medium">
                            {row.paymentType === "UPI" ? "UPI" : row.paymentType === "CASH" ? "Cash" : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Amount paid</dt>
                          <dd className="font-medium">{formatPrice(row.paid)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Course price</dt>
                          <dd className="font-medium">
                            {row.coursePrice !== undefined ? formatPrice(row.coursePrice) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Remaining</dt>
                          <dd className="font-medium">
                            {row.remainingAmount !== undefined ? formatPrice(row.remainingAmount) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Subscription</dt>
                          <dd className="font-medium">
                            {row.subscriptionId ?? "—"}
                            {row.subscriptionStatus ? ` · ${row.subscriptionStatus}` : ""}
                          </dd>
                        </div>
                      </dl>
                    </article>
                ))}
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </section>
  );
}

function CoursePanel() {
  const { raw: courses, loading, error: loadError, reload } = useCourses({ includeInactive: true });
  const { page, setPage, pageCount, slice, from, to, total } = usePaged(courses);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [error, setError] = useState("");
  const [videoCourse, setVideoCourse] = useState<AdminCourse | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [videoError, setVideoError] = useState("");
  const [videoPending, setVideoPending] = useState(false);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDurationHours("");
    setPrice("");
    setStatus("ACTIVE");
    setThumbnailUrl("");
    setError("");
  }

  function resetVideoForm() {
    setVideoTitle("");
    setVideoUrl("");
    setSortOrder("1");
    setDurationMinutes("");
    setVideoError("");
  }

  function openVideoModal(course: AdminCourse) {
    resetVideoForm();
    setVideoCourse(course);
  }

  function closeVideoModal() {
    setVideoCourse(null);
    resetVideoForm();
    setVideoPending(false);
  }

  async function onAddVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!videoCourse) return;
    if (videoTitle.trim().length < 2) {
      setVideoError("Add a video title.");
      return;
    }
    if (!videoUrl.trim()) {
      setVideoError("Add a video URL.");
      return;
    }
    const order = Number(sortOrder);
    const minutes = Number(durationMinutes);
    if (!Number.isFinite(order) || order < 1) {
      setVideoError("Enter a sort order of 1 or more.");
      return;
    }
    if (!Number.isFinite(minutes) || minutes < 1) {
      setVideoError("Enter duration in minutes.");
      return;
    }
    setVideoError("");
    setVideoPending(true);
    try {
      await createAdminCourseVideo({
        courseId: videoCourse.id,
        title: videoTitle.trim(),
        videoUrl: videoUrl.trim(),
        sortOrder: order,
        durationMinutes: minutes,
      });
      toast.success("Video saved successfully.");
      closeVideoModal();
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Could not add this video.");
    } finally {
      setVideoPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Add a course title.");
      return;
    }
    if (description.trim().length < 3) {
      setError("Add a short course description.");
      return;
    }
    const hours = Number(durationHours);
    const amount = Number(price);
    if (!Number.isFinite(hours) || hours < 1 || !Number.isFinite(amount) || amount < 0) {
      setError("Add duration in hours and a price.");
      return;
    }
    if (!thumbnailUrl.trim()) {
      setError("Add a thumbnail URL.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await addCourse({
        title: title.trim(),
        description: description.trim(),
        durationHours: hours,
        price: Number(amount.toFixed(2)),
        status,
        thumbnailUrl: thumbnailUrl.trim(),
      });
      toast.success("Course saved successfully.");
      resetForm();
      setOpen(false);
      await reload();
      setPage(Math.ceil((courses.length + 1) / PAGE_SIZE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this course.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h2 className="text-xl">Course list</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading programmes…" : `${courses.length} programmes`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/courses"
            className="text-sm font-semibold text-chocolate underline-offset-4 hover:underline"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold"
          >
            <Plus className="h-4 w-4" /> Add course
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-border bg-secondary/60 text-xs tracking-[0.12em] text-muted-foreground uppercase">
            <tr>
              <th className="px-6 py-3 font-semibold">Thumb</th>
              <th className="px-6 py-3 font-semibold">Course</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Duration</th>
              <th className="px-6 py-3 font-semibold">Price</th>
              <th className="px-6 py-3 font-semibold">Video</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  Loading courses…
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-destructive">
                  {loadError}
                </td>
              </tr>
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  No courses yet.
                </td>
              </tr>
            ) : (
              slice.map((course) => (
                <tr key={course.id} className="hover:bg-secondary/40">
                  <td className="px-6 py-4">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        className="h-10 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-16 rounded-md bg-secondary" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-chocolate">{course.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {course.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                      {course.status || "ACTIVE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {course.durationHours ? `${course.durationHours} hours` : "—"}
                  </td>
                  <td className="px-6 py-4 font-semibold">{formatPrice(course.price)}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => openVideoModal(course)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-chocolate transition-colors hover:bg-secondary"
                    >
                      <Video className="h-3.5 w-3.5" /> Add video
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        page={page}
        pageCount={pageCount}
        from={from}
        to={to}
        total={total}
        onPage={setPage}
      />

      <AdminModal
        open={open}
        title="Add course"
        onClose={() => {
          resetForm();
          setOpen(false);
        }}
      >
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium sm:col-span-2">
            Course title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(fieldClass, "mt-2")}
              placeholder="IAS Prelims GS"
            />
          </label>
          <label className="block text-sm font-medium">
            Duration (hours)
            <input
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              type="number"
              min={1}
              className={cn(fieldClass, "mt-2")}
              placeholder="120"
            />
          </label>
          <label className="block text-sm font-medium">
            Price
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min={0}
              step="0.01"
              className={cn(fieldClass, "mt-2")}
              placeholder="9999.00"
            />
          </label>
          <label className="block text-sm font-medium">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={cn(fieldClass, "mt-2")}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <label className="block text-sm font-medium sm:col-span-2">
            Thumbnail URL
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className={cn(fieldClass, "mt-2")}
              placeholder="https://example.com/thumb.jpg"
            />
          </label>
          {thumbnailUrl.trim() ? (
            <img
              src={thumbnailUrl.trim()}
              alt=""
              className="aspect-16/10 w-full rounded-2xl object-cover sm:col-span-2"
            />
          ) : null}
          <label className="block text-sm font-medium sm:col-span-2">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Complete GS course"
            />
          </label>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:pointer-events-none disabled:opacity-60 sm:col-span-2"
          >
            {pending ? "Saving…" : "Save course"}
          </button>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(videoCourse)}
        title={videoCourse ? `Add video — ${videoCourse.title}` : "Add video"}
        onClose={closeVideoModal}
      >
        {videoCourse && (
          <form onSubmit={onAddVideo} className="grid gap-4">
            <label className="block text-sm font-medium">
              Title
              <input
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className={cn(fieldClass, "mt-2")}
                placeholder="Lesson 1 - Getting Started"
              />
            </label>
            <label className="block text-sm font-medium">
              Video URL
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className={cn(fieldClass, "mt-2")}
                placeholder="https://youtu.be/dQw4w9WgXcQ"
              />
            </label>
            <label className="block text-sm font-medium">
              Sort order
              <input
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={cn(fieldClass, "mt-2")}
                placeholder="1"
              />
            </label>
            <label className="block text-sm font-medium">
              Duration (minutes)
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className={cn(fieldClass, "mt-2")}
                placeholder="30"
              />
            </label>
            {videoError && <p className="text-sm text-destructive">{videoError}</p>}
            <button
              type="submit"
              disabled={videoPending}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:pointer-events-none disabled:opacity-60"
            >
              {videoPending ? "Saving…" : "Save video"}
            </button>
          </form>
        )}
      </AdminModal>
    </section>
  );
}

function BannerPanel() {
  const [images, setImages] = useState<AdminImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { page, setPage, pageCount, slice, from, to, total } = usePaged(images);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      setImages(await listPublicImages());
      setLoadError("");
    } catch (err) {
      setImages([]);
      setLoadError(err instanceof Error ? err.message : "Could not load images.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  function resetForm() {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setError("");
  }

  async function pickValidatedFile(next: File | undefined) {
    if (!next) return null;
    const valid = await assertBannerFile(next);
    return valid;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(
        `Upload a ${BANNER_IMAGE.width}×${BANNER_IMAGE.height} image — the same size as the home carousel photos.`,
      );
      return;
    }
    setError("");
    setPending(true);
    try {
      await uploadAdminImage(file);
      toast.success("Banner saved successfully.");
      resetForm();
      setOpen(false);
      await loadImages();
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload this image.");
    } finally {
      setPending(false);
    }
  }

  async function onReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    e.target.value = "";
    const imageId = replaceId;
    setReplaceId(null);
    if (!next || !imageId) return;
    try {
      const valid = await pickValidatedFile(next);
      if (!valid) return;
      await updateAdminImage(imageId, valid);
      toast.success("Image updated successfully.");
      await loadImages();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not replace this image.");
    }
  }

  async function onDelete(imageId: string) {
    try {
      await deleteAdminImage(imageId);
      await loadImages();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not delete this image.");
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h2 className="text-xl">Banner image</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading images…" : `${images.length} images`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold"
        >
          <Plus className="h-4 w-4" /> Add banner
        </button>
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => void onReplaceFile(e)}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-border bg-secondary/60 text-xs tracking-[0.12em] text-muted-foreground uppercase">
            <tr>
              <th className="px-6 py-3 font-semibold">Image</th>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-muted-foreground">
                  Loading images…
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-destructive">
                  {loadError}
                </td>
              </tr>
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-muted-foreground">
                  No images yet.
                </td>
              </tr>
            ) : (
              slice.map((image) => (
                <tr key={image.id} className="hover:bg-secondary/40">
                  <td className="px-6 py-4">
                    {image.url ? (
                      <img src={image.url} alt="" className="h-10 w-16 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-16 rounded-md bg-secondary" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-chocolate">{image.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplaceId(image.id);
                          replaceInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-chocolate transition-colors hover:bg-secondary"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(image.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-secondary"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePager
        page={page}
        pageCount={pageCount}
        from={from}
        to={to}
        total={total}
        onPage={setPage}
      />

      <AdminModal
        open={open}
        title="Add banner"
        onClose={() => {
          resetForm();
          setOpen(false);
        }}
      >
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <p className="text-sm font-medium">Banner image</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Must be {BANNER_IMAGE.width}×{BANNER_IMAGE.height} px — the same size as the home
              carousel photos (hero.jpg). JPG, PNG or WebP, under 2.5 MB.
            </p>
            <label className="mt-3 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-dashed border-border bg-background">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const next = e.target.files?.[0];
                  e.target.value = "";
                  if (!next) return;
                  try {
                    const valid = await pickValidatedFile(next);
                    if (!valid) return;
                    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                    setFile(valid);
                    setPreviewUrl(URL.createObjectURL(valid));
                    setError("");
                  } catch (err) {
                    setFile(null);
                    setPreviewUrl("");
                    setError(err instanceof Error ? err.message : "This image cannot be used.");
                  }
                }}
                className="sr-only"
              />
              {previewUrl ? (
                <img src={previewUrl} alt="" className="aspect-[20/9] w-full object-cover" />
              ) : (
                <span className="flex aspect-[20/9] w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  Upload {BANNER_IMAGE.width}×{BANNER_IMAGE.height} banner
                </span>
              )}
            </label>
            {file ? <p className="mt-2 text-xs text-muted-foreground">{file.name}</p> : null}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? "Uploading…" : "Save banner"}
          </button>
        </form>
      </AdminModal>
    </section>
  );
}
