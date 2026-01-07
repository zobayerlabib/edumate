// src/pages/StudentDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function StatCard({ title, value, sub, variant = "blue" }) {
  return (
    <div className="col-12 col-md-6 col-xl-3">
      <div className={`card dash-card dash-card--${variant} h-100`}>
        <div className="card-body">
          <div className="dash-muted">{title}</div>
          <div className="dash-value">{value}</div>
          {sub ? <div className="dash-sub">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

function BarChart({ labels = [], values = [], height = 170 }) {
  const max = Math.max(1, ...values);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height }}>
        {values.map((v, i) => {
          const h = Math.round((v / max) * (height - 20));
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: h,
                  borderRadius: 10,
                  background: "rgba(13,110,253,0.25)",
                  border: "1px solid rgba(13,110,253,0.35)",
                }}
                title={`${labels[i]}: ${v}`}
              />
              <div
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  color: "rgba(0,0,0,0.55)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={labels[i]}
              >
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function TopicCard({ item, onPractice, onLessons }) {
  const mastery = Math.round(item?.mastery || 0);
  let variant = "red";
  if (mastery >= 70) variant = "green";
  else if (mastery >= 45) variant = "orange";

  return (
    <div className={`dash-topic dash-topic--${variant}`}>
      <div className="dash-topic-title">
        {item.subject} — {item.topic}
      </div>
      <div className="dash-topic-sub">Mastery: {mastery}%</div>

      <div className="dash-topic-actions">
        <button
          className="btn btn-sm btn-light"
          type="button"
          onClick={() => onPractice?.(item)}
        >
          Practice
        </button>

        <button
          className="btn btn-sm btn-outline-light"
          type="button"
          onClick={() => onLessons?.(item)}
        >
          Lessons
        </button>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("edumate_theme") === "dark"
  );

  const [me, setMe] = useState(null);

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [report, setReport] = useState({
    strong_topics: [],
    medium_topics: [],
    weak_topics: [],
  });

  const [stats, setStats] = useState(null);

  // ===============================
  //  Activity / Weekly chart
  // ===============================
  const [weeklyActivity, setWeeklyActivity] = useState([]); // [{ label/week, attempts, avg_score }]
  const [weeklyMetric, setWeeklyMetric] = useState("attempts"); // "attempts" | "avg_score"

  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [lessonQuizzes, setLessonQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "Hi! I am EduMate AI Tutor 🤖. Ask me anything!" },
  ]);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [billingInterval, setBillingInterval] = useState("month");
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("theme-dark");
      localStorage.setItem("edumate_theme", "dark");
    } else {
      root.classList.remove("theme-dark");
      localStorage.setItem("edumate_theme", "light");
    }
  }, [darkMode]);

  const masteryAvg = useMemo(() => {
    const all = [
      ...(report.strong_topics || []),
      ...(report.medium_topics || []),
      ...(report.weak_topics || []),
    ];
    if (!all.length) return 0;
    const avg = all.reduce((sum, r) => sum + (r.mastery || 0), 0) / all.length;
    return Math.round(avg);
  }, [report]);

  const weakTop = useMemo(
    () => (report.weak_topics || []).slice(0, 6),
    [report]
  );

  const weeklyChart = useMemo(() => {
    const list = Array.isArray(weeklyActivity) ? weeklyActivity : [];
    const labels = list.map((w, i) => {
      return (
        w.label ||
        w.week ||
        w.week_label ||
        w.name ||
        w.date ||
        `W${i + 1}`
      );
    });

    const values = list.map((w) => {
      if (weeklyMetric === "avg_score") {
        const v = w.avg_score ?? w.average_score ?? w.avg ?? 0;
        return Math.round(Number(v) || 0);
      }
      const v = w.attempts ?? w.count ?? w.total ?? 0;
      return Number(v) || 0;
    });

    return { labels, values };
  }, [weeklyActivity, weeklyMetric]);

  const highestScore = useMemo(() => {
    const v =
      stats?.highest_score ??
      stats?.high_score ??
      stats?.max_score ??
      stats?.best_score ??
      null;
    return v == null ? null : Math.round(Number(v) || 0);
  }, [stats]);

  const lowestScore = useMemo(() => {
    const v =
      stats?.lowest_score ??
      stats?.low_score ??
      stats?.min_score ??
      stats?.worst_score ??
      null;
    return v == null ? null : Math.round(Number(v) || 0);
  }, [stats]);

  const lessonsCount = lessons.length;

  const currentCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const apiBase = api?.defaults?.baseURL || "";
  const fileLink = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (!apiBase) return url;
    if (apiBase.endsWith("/") && url.startsWith("/"))
      return apiBase.slice(0, -1) + url;
    return apiBase + url;
  };

  const fetchMe = async () => {
    const meRes = await api.get("/auth/me");
    setMe(meRes.data);
    return meRes.data;
  };

  const renderBotMarkdown = (text) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>,
          ul: ({ children }) => (
            <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "0 0 10px", paddingLeft: 18 }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: 6 }}>{children}</li>,
          h1: ({ children }) => (
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              {children}
            </div>
          ),
          h2: ({ children }) => (
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
              {children}
            </div>
          ),
          h3: ({ children }) => (
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
              {children}
            </div>
          ),
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code
                  style={{
                    padding: "2px 6px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.08)",
                    fontSize: 13,
                  }}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.08)",
                  overflow: "auto",
                  marginBottom: 10,
                }}
              >
                <code>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text || ""}
      </ReactMarkdown>
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    if (checkout === "success") {
      fetchMe().catch(() => {});
      setToast("Payment successful. Premium is being activated.");
      params.delete("checkout");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }

    if (checkout === "cancel") {
      setToast("Payment cancelled. You can try again anytime.");
      params.delete("checkout");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setError("");
        await fetchMe();

        const cRes = await api.get("/courses/my");
        const list = cRes.data.courses || [];
        setCourses(list);
        if (list.length) setSelectedCourseId(list[0].id);

        const rRes = await api.get("/attempts/my/report");
        setReport(rRes.data);

        try {
          const sRes = await api.get("/attempts/my/stats");
          setStats(sRes.data);
        } catch {
          setStats(null);
        }

        // Weekly activity (optional endpoint)
        // If your backend does not have this endpoint, it will fail silently and chart will stay hidden.
        try {
          const wRes = await api.get("/attempts/my/weekly-progress?weeks=8");
          const data = wRes.data || {};

          // Preferred format: weeks_data = [{label, attempts, avg_score}]
          if (Array.isArray(data.weeks_data)) {
            setWeeklyActivity(data.weeks_data);
          } else if (Array.isArray(data.weeks) && Array.isArray(data.attempts)) {
            // Backward compatible: arrays
            const labels = data.weeks;
            const attemptsArr = data.attempts || [];
            const avgArr = data.avg_scores || [];
            const list = labels.map((label, i) => ({
              label,
              attempts: Number(attemptsArr[i] || 0),
              avg_score: Number(avgArr[i] || 0),
            }));
            setWeeklyActivity(list);
          } else {
            setWeeklyActivity([]);
          }
        } catch {
          setWeeklyActivity([]);
        }
      } catch (e) {
        setError("Failed to load dashboard. Please login again.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadLessons() {
      setSelectedLesson(null);
      setLessonQuizzes([]);
      setSelectedQuizId(null);
      setQuizData(null);
      setAttemptResult(null);

      if (!selectedCourseId) {
        setLessons([]);
        return;
      }

      setLessonsLoading(true);
      try {
        const lRes = await api.get(`/lessons/course/${selectedCourseId}`);
        setLessons(lRes.data.lessons || []);
      } catch {
        setLessons([]);
      } finally {
        setLessonsLoading(false);
      }
    }
    loadLessons();
  }, [selectedCourseId]);

  const loadQuizzesForLesson = async (lessonId) => {
    if (!lessonId) return;
    setQuizzesLoading(true);
    setLessonQuizzes([]);
    setSelectedQuizId(null);
    setQuizData(null);
    setAttemptResult(null);

    try {
      const res = await api.get(`/quizzes/lesson/${lessonId}`);
      setLessonQuizzes(res.data?.quizzes || []);
    } catch (e) {
      setLessonQuizzes([]);
      setError(
        e?.response?.data?.detail || "Failed to load quizzes for this lesson."
      );
    } finally {
      setQuizzesLoading(false);
    }
  };

  const loadQuiz = async (quizId) => {
    if (!quizId) return;
    setQuizLoading(true);
    setQuizData(null);
    setQuizAnswers([]);
    setAttemptResult(null);

    try {
      const res = await api.get(`/quizzes/${quizId}`);
      const q = res.data;
      setQuizData(q);
      const n = (q?.questions || []).length;
      setQuizAnswers(new Array(n).fill(""));
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!quizData?.quiz_id) return;

    const missing = quizAnswers.some((a) => !a);
    if (missing) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitLoading(true);
    setError("");
    try {
      const res = await api.post(`/attempts/submit/${quizData.quiz_id}`, {
        answers: quizAnswers,
      });
      setAttemptResult(res.data);

      try {
        const rRes = await api.get("/attempts/my/report");
        setReport(rRes.data);
      } catch {}

      try {
        const sRes = await api.get("/attempts/my/stats");
        setStats(sRes.data);
      } catch {}
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const sendMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    setChatMessages((prev) => [...prev, { from: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: msg });
      const reply = res.data?.reply || "No reply.";
      setChatMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { from: "bot", text: "AI error. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const openUpgrade = () => {
    setBillingError("");
    setBillingInterval("month");
    setShowUpgrade(true);
  };

  const startCheckout = async () => {
    setBillingLoading(true);
    setBillingError("");

    try {
      const res = await api.post("/billing/create-checkout-session", {
        plan: "student_premium",
        interval: billingInterval,
      });

      const checkoutUrl = res.data?.checkout_url || res.data?.url;
      if (!checkoutUrl) {
        throw new Error("Checkout URL not returned from backend.");
      }

      window.location.href = checkoutUrl;
    } catch (e) {
      setBillingError(
        e?.response?.data?.detail ||
          e?.message ||
          "Failed to start checkout. Check backend billing endpoint."
      );
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="card dash-card p-3">Loading Student Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const displayName = me?.email ? me.email.split("@")[0] : "Student";
  const isPremium = (me?.plan || "free") === "premium";
  const planLabel = (me?.plan || "free").toUpperCase();

  const premiumUntilText = me?.premium_until
    ? new Date(me.premium_until).toLocaleString()
    : "";

  const priceMonth = "RM 9.90 / month";
  const priceYear = "RM 99.00 / year";

  return (
    <div className="container py-4">
      {toast ? (
        <div
          style={{
            position: "fixed",
            right: 18,
            top: 18,
            zIndex: 2000,
            maxWidth: 360,
          }}
          className="alert alert-success shadow"
        >
          {toast}
        </div>
      ) : null}

      <div className="dash-header">
        <div className="dash-header-top">
          <div>
            <div className="dash-title">Student Panel</div>
            <div className="dash-muted">
              Welcome back, <b>{displayName}</b>{" "}
              <span className="wave" aria-label="wave">
                👋
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge ${isPremium ? "bg-success" : "bg-secondary"}`}
              style={{ padding: "8px 10px", borderRadius: 999 }}
              title={isPremium ? "Premium user" : "Free user"}
            >
              Plan: {planLabel}
            </span>

            {!isPremium && (
              <button
                className="btn btn-sm btn-outline-primary"
                type="button"
                onClick={openUpgrade}
              >
                Upgrade
              </button>
            )}

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDarkMode((v) => !v)}
              type="button"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        <div className="dash-tabs">
          <button
            className={`dash-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
            type="button"
          >
            📊 Dashboard
          </button>

          <button
            className={`dash-tab ${activeTab === "courses" ? "active" : ""}`}
            onClick={() => setActiveTab("courses")}
            type="button"
          >
            📚 Courses
          </button>

          <button
            className={`dash-tab ${activeTab === "quizzes" ? "active" : ""}`}
            onClick={() => setActiveTab("quizzes")}
            type="button"
          >
            📝 Quizzes
          </button>

          <button
            className={`dash-tab ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
            type="button"
          >
            🤖 AI Help
          </button>

          <button
            className={`dash-tab ${
              activeTab === "notifications" ? "active" : ""
            }`}
            onClick={() => setActiveTab("notifications")}
            type="button"
          >
            🔔 Notifications
          </button>

          <button
            className={`dash-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            🧑‍💻 Profile
          </button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div className="row g-3 mt-3">
            <StatCard
              title="Mastery (Avg)"
              value={`${masteryAvg}%`}
              sub="From mastery report"
              variant="blue"
            />
            <StatCard
              title="My Courses"
              value={courses.length}
              sub="Enrolled courses"
              variant="purple"
            />
            <StatCard
              title="Lessons"
              value={lessonsCount}
              sub={currentCourse ? `In ${currentCourse.title}` : "Total lessons"}
              variant="green"
            />
            <StatCard
              title="Weak Topics"
              value={weakTop.length}
              sub="Focus to improve"
              variant="orange"
            />
          </div>

          {stats && (
            <div className="row g-3 mt-1">
              <StatCard
                title="Quizzes Done"
                value={stats.quizzes_done ?? 0}
                sub="Total attempts"
                variant="blue"
              />
              <StatCard
                title="Average Score"
                value={`${stats.avg_score ?? 0}%`}
                sub="Across attempts"
                variant="green"
              />
              <StatCard
                title="Study Streak"
                value={`${stats.streak_days ?? 0} days`}
                sub="Consecutive days"
                variant="orange"
              />
              <StatCard
                title="Last Attempt"
                value={stats.last_attempt_at ? "Yes" : "No"}
                sub={stats.last_attempt_at || ""}
                variant="purple"
              />
            </div>
          )}


          <div className="row g-3 mt-1">
            <div className="col-12">
              <div className="card dash-card dash-section dash-section--softblue">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h5 className="mb-0">Activity Overview</h5>

                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-sm ${
                          weeklyMetric === "attempts"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        type="button"
                        onClick={() => setWeeklyMetric("attempts")}
                      >
                        Attempts
                      </button>
                      <button
                        className={`btn btn-sm ${
                          weeklyMetric === "avg_score"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        type="button"
                        onClick={() => setWeeklyMetric("avg_score")}
                      >
                        Avg Score
                      </button>
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <StatCard
                      title="Total Attempts"
                      value={stats?.quizzes_done ?? 0}
                      sub="All time"
                      variant="blue"
                    />
                    <StatCard
                      title="Highest Score"
                      value={highestScore == null ? "—" : `${highestScore}%`}
                      sub="Best attempt"
                      variant="green"
                    />
                    <StatCard
                      title="Lowest Score"
                      value={lowestScore == null ? "—" : `${lowestScore}%`}
                      sub="Lowest attempt"
                      variant="orange"
                    />
                    <StatCard
                      title="Weekly Streak"
                      value={`${stats?.streak_days ?? 0} days`}
                      sub="Consecutive days"
                      variant="purple"
                    />
                  </div>

                  <div className="mt-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="dash-muted">
                        Average Score Progress
                      </div>
                      <div style={{ fontWeight: 800 }}>
                        {Math.round(stats?.avg_score ?? 0)}%
                      </div>
                    </div>

                    <div className="progress" style={{ height: 10, borderRadius: 999 }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${Math.min(100, Math.max(0, Math.round(stats?.avg_score ?? 0)))}%` }}
                        aria-valuenow={Math.round(stats?.avg_score ?? 0)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>

                    <div className="dash-muted mt-2" style={{ fontSize: 12 }}>
                      Based on your quiz attempts and scores.
                    </div>
                  </div>

                  <div className="mt-3">
                    {weeklyChart.labels.length ? (
                      <>
                        <div className="dash-muted mb-2">
                          Weekly Activity (last {weeklyChart.labels.length} weeks)
                        </div>
                        <BarChart labels={weeklyChart.labels} values={weeklyChart.values} />
                      </>
                    ) : (
                      <div className="dash-muted">
                        Weekly chart will appear after you take more quizzes.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12 col-lg-6">
              <div className="card dash-card dash-section dash-section--softblue h-100">
                <div className="card-body">
                  <h5 className="mb-2">My Courses</h5>
                  {courses.length === 0 ? (
                    <div className="dash-muted">No courses yet.</div>
                  ) : (
                    <>
                      <select
                        className="form-select"
                        value={selectedCourseId || ""}
                        onChange={(e) =>
                          setSelectedCourseId(Number(e.target.value))
                        }
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.subject})
                          </option>
                        ))}
                      </select>

                      <div className="dash-muted mt-2">
                        Lessons in selected course: <b>{lessonsCount}</b>
                      </div>

                      <div className="mt-2 d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-primary"
                          type="button"
                          onClick={() => setActiveTab("courses")}
                        >
                          View Lessons
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={() => setActiveTab("quizzes")}
                        >
                          Take a Quiz
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card dash-card dash-section dash-section--softpurple h-100">
                <div className="card-body">
                  <h5 className="mb-2">Weak Topics</h5>
                  {weakTop.length === 0 ? (
                    <div className="dash-muted">
                      Take a quiz first to generate mastery.
                    </div>
                  ) : (
                    <div className="dash-topics-grid">
                      {weakTop.map((t, idx) => (
                        <TopicCard
                          key={idx}
                          item={t}
                          onPractice={() => {
                            setActiveTab("quizzes");
                            setError("");
                          }}
                          onLessons={() => {
                            setActiveTab("courses");
                            setError("");
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "courses" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softgreen">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0">Courses & Lessons</h5>

                {courses.length > 0 && (
                  <select
                    className="form-select"
                    style={{ maxWidth: 360 }}
                    value={selectedCourseId || ""}
                    onChange={(e) =>
                      setSelectedCourseId(Number(e.target.value))
                    }
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.subject})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mt-3">
                {courses.length === 0 ? (
                  <div className="dash-muted">No courses yet.</div>
                ) : lessonsLoading ? (
                  <div className="dash-muted">Loading lessons...</div>
                ) : lessons.length === 0 ? (
                  <div className="dash-muted">
                    No lessons found for this course yet.
                  </div>
                ) : (
                  <div className="row g-3">
                    {lessons.map((l) => (
                      <div className="col-12 col-lg-6" key={l.id}>
                        <div className="dash-course">
                          <div className="dash-course-title">{l.title}</div>
                          <div className="dash-muted">Topic: {l.topic}</div>

                          {l.attachment_url ? (
                            <div className="dash-muted mt-1">
                              Attachment:{" "}
                              <a
                                href={fileLink(l.attachment_url)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {l.attachment_name || "Open file"}
                              </a>
                            </div>
                          ) : null}

                          <div className="mt-2 d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              onClick={() => setSelectedLesson(l)}
                            >
                              View Lesson
                            </button>

                            <button
                              className="btn btn-sm btn-primary"
                              type="button"
                              onClick={() => {
                                setActiveTab("quizzes");
                                setSelectedLesson(l);
                                loadQuizzesForLesson(l.id);
                              }}
                            >
                              View Quizzes
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedLesson && (
                <div className="card mt-3 dash-card">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div>
                        <h5 className="mb-1">{selectedLesson.title}</h5>
                        <div className="dash-muted">
                          Topic: {selectedLesson.topic}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        onClick={() => setSelectedLesson(null)}
                      >
                        Close
                      </button>
                    </div>

                    {selectedLesson.attachment_url ? (
                      <div className="mt-2">
                        <a
                          className="btn btn-sm btn-outline-primary"
                          href={fileLink(selectedLesson.attachment_url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Attachment
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <div className="dash-muted mb-1">Lesson Text</div>
                      <div
                        className="p-3"
                        style={{
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 12,
                          whiteSpace: "pre-wrap",
                          maxHeight: 260,
                          overflow: "auto",
                        }}
                      >
                        {selectedLesson.content_text ||
                          "No text content for this lesson."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "quizzes" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softorange">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0">Quizzes</h5>

                {courses.length > 0 && (
                  <select
                    className="form-select"
                    style={{ maxWidth: 360 }}
                    value={selectedCourseId || ""}
                    onChange={(e) =>
                      setSelectedCourseId(Number(e.target.value))
                    }
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.subject})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mt-3">
                {lessonsLoading ? (
                  <div className="dash-muted">Loading lessons...</div>
                ) : lessons.length === 0 ? (
                  <div className="dash-muted">
                    No lessons yet. Ask your teacher to add lessons.
                  </div>
                ) : (
                  <>
                    <div className="dash-muted mb-2">
                      Step 1: Choose a lesson
                    </div>
                    <select
                      className="form-select"
                      value={selectedLesson?.id || ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const l = lessons.find((x) => x.id === id) || null;
                        setSelectedLesson(l);
                        if (l) loadQuizzesForLesson(l.id);
                      }}
                    >
                      <option value="" disabled>
                        Select lesson...
                      </option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title} — {l.topic}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              {selectedLesson && (
                <div className="mt-3">
                  <div className="dash-muted mb-2">
                    Step 2: Choose a quiz
                  </div>

                  {quizzesLoading ? (
                    <div className="dash-muted">Loading quizzes...</div>
                  ) : lessonQuizzes.length === 0 ? (
                    <div className="dash-muted">
                      No quizzes for this lesson yet. Ask teacher to generate
                      one.
                    </div>
                  ) : (
                    <div className="d-flex gap-2 flex-wrap">
                      {lessonQuizzes.map((q) => (
                        <button
                          key={q.quiz_id}
                          className={`btn btn-sm ${
                            selectedQuizId === q.quiz_id
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          type="button"
                          onClick={() => {
                            setSelectedQuizId(q.quiz_id);
                            loadQuiz(q.quiz_id);
                          }}
                        >
                          Quiz #{q.quiz_id} ({q.difficulty})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {quizLoading && (
                <div className="dash-muted mt-3">Loading quiz...</div>
              )}

              {quizData && (
                <div className="card mt-3 dash-card">
                  <div className="card-body">
                    <h5 className="mb-1">
                      Quiz #{quizData.quiz_id} ({quizData.difficulty})
                    </h5>
                    <div className="dash-muted mb-3">
                      Lesson: {selectedLesson?.title || ""}
                    </div>

                    {(quizData.questions || []).map((q, idx) => (
                      <div key={idx} className="mb-3">
                        <div className="fw-bold mb-2">
                          Q{idx + 1}. {q.question}
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {(q.options || []).map((opt, oi) => (
                            <label
                              key={oi}
                              className="d-flex align-items-center gap-2"
                              style={{ cursor: "pointer" }}
                            >
                              <input
                                type="radio"
                                name={`q_${idx}`}
                                value={opt}
                                checked={quizAnswers[idx] === opt}
                                onChange={() =>
                                  setQuizAnswers((prev) => {
                                    const next = [...prev];
                                    next[idx] = opt;
                                    return next;
                                  })
                                }
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      className="btn btn-success"
                      type="button"
                      disabled={submitLoading}
                      onClick={submitQuiz}
                    >
                      {submitLoading ? "Submitting..." : "Submit Quiz"}
                    </button>
                  </div>
                </div>
              )}

              {attemptResult && (
                <div className="card mt-3 dash-card">
                  <div className="card-body">
                    <h5 className="mb-2">Result</h5>
                    <div className="dash-muted">
                      Score: <b>{Math.round(attemptResult.score || 0)}%</b> —{" "}
                      {attemptResult.subject} / {attemptResult.topic}
                    </div>

                    <div className="mt-3">
                      {(attemptResult.details || []).map((d, i) => (
                        <div
                          key={i}
                          className="p-2 mb-2"
                          style={{
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          <div className="fw-bold">{d.question}</div>
                          <div className="dash-muted">
                            Your answer: <b>{d.student_answer}</b>
                          </div>
                          <div className="dash-muted">
                            Correct: <b>{d.correct_answer}</b>
                          </div>
                          <div className="dash-muted">
                            {d.is_correct ? "Correct" : "Wrong"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softblue">
            <div className="card-body">
              <h5 className="mb-2">AI Help</h5>
              <div className="dash-muted">Ask questions about your lessons.</div>

              <div className="chatbox mt-3">
                <div className="chat-messages">
                  {chatMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`chat-bubble ${
                        m.from === "user" ? "chat-user" : "chat-bot"
                      }`}
                    >
                      {m.from === "bot" ? (
                        renderBotMarkdown(m.text)
                      ) : (
                        <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                      )}
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="chat-bubble chat-bot">
                      {renderBotMarkdown("Typing...")}
                    </div>
                  )}
                </div>

                <div className="chat-input">
                  <input
                    className="form-control"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={sendMessage}
                    disabled={chatLoading}
                  >
                    Send
                  </button>
                </div>

                <div className="dash-muted mt-2" style={{ fontSize: 12 }}>
                  You are enjoying our leatest model
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softblue">
            <div className="card-body">
              <h5 className="mb-2">Notifications</h5>
              <div className="dash-note">
                New lesson available in your course.
              </div>
              <div className="dash-note">
                Reminder: complete weak topic practice today.
              </div>
              <div className="dash-note">Keep your streak going.</div>
            </div>
          </div>
        </div>
      )}
{activeTab === "profile" && (
  <div className="card dash-card p-4">
    <h5 className="mb-3">Profile</h5>

    <div className="mb-2">
      <b>Email:</b> {me?.email}
    </div>

    <div className="mb-2">
      <b>Plan:</b> {planLabel}
    </div>

    {isPremium && premiumUntilText ? (
      <div className="alert alert-success mt-3">
        <b>Premium active until:</b> {premiumUntilText}
      </div>
    ) : (
      <div className="alert alert-warning mt-3">
        You are currently on the Free plan.
      </div>
    )}
  </div>
)}


      {showUpgrade && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 1500,
            }}
            onClick={() => {
              if (!billingLoading) setShowUpgrade(false);
            }}
          />

          <div
            className="card shadow"
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1600,
              width: "min(560px, 92vw)",
              borderRadius: 16,
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                  <h5 className="mb-1">EduMate Premium</h5>
                  <div className="dash-muted">
                    Unlock advanced AI tutoring and better quiz support.
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  onClick={() => setShowUpgrade(false)}
                  disabled={billingLoading}
                >
                  Close
                </button>
              </div>

              <div className="mt-3">
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className={`btn btn-sm ${
                      billingInterval === "month"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    type="button"
                    onClick={() => setBillingInterval("month")}
                    disabled={billingLoading}
                  >
                    Monthly
                  </button>
                  <button
                    className={`btn btn-sm ${
                      billingInterval === "year"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    type="button"
                    onClick={() => setBillingInterval("year")}
                    disabled={billingLoading}
                  >
                    Yearly
                  </button>
                </div>

                <div className="mt-3">
                  <div className="dash-muted">Selected plan</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {billingInterval === "month" ? priceMonth : priceYear}
                  </div>
                  <div className="dash-muted" style={{ marginTop: 6 }}>
                    Payment is processed securely using Stripe Checkout.
                  </div>
                </div>

                <div className="mt-3">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    What you get
                  </div>
                  <ul style={{ marginBottom: 0 }}>
                    <li>Advanced chatbot (Gemini 3 Flash)</li>
                    <li>Longer, step-by-step explanations</li>
                    <li>Better quiz support and guidance</li>
                  </ul>
                </div>

                {billingError ? (
                  <div className="alert alert-danger mt-3">{billingError}</div>
                ) : null}

                <div className="mt-3 d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowUpgrade(false)}
                    disabled={billingLoading}
                  >
                    Not now
                  </button>

                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={startCheckout}
                    disabled={billingLoading}
                  >
                    {billingLoading ? "Redirecting..." : "Continue to Payment"}
                  </button>
                </div>

                <div className="dash-muted mt-2" style={{ fontSize: 12 }}></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
