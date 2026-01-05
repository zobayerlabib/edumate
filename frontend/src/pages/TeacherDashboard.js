// src/pages/TeacherDashboard.js
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
function BarChart({ labels = [], values = [], height = 180 }) {
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
              <div style={{ fontSize: 11, marginTop: 6, color: "rgba(0,0,0,0.55)" }}>
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cleanBotText(text) {
  if (!text) return "";

  let t = String(text);

  t = t.replace(/```(?:json|markdown|md|text)?\s*/gi, "");
  t = t.replace(/```/g, "");

  const trimmed = t.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const obj = JSON.parse(trimmed);
      return JSON.stringify(obj, null, 2);
    } catch {
      return t;
    }
  }

  return t;
}

export default function TeacherDashboard() {
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
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [creating, setCreating] = useState(false);

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  const [genDifficulty, setGenDifficulty] = useState("easy");
  const [genNum, setGenNum] = useState(5);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [viewQuizLoading, setViewQuizLoading] = useState(false);
  const [viewQuiz, setViewQuiz] = useState(null);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "Hi! I am EduMate Teacher Assistant. Ask me anything." },
  ]);

  const [openStudentsCourseId, setOpenStudentsCourseId] = useState(null);
  const [studentsByCourse, setStudentsByCourse] = useState({});
  const [studentsLoadingByCourse, setStudentsLoadingByCourse] = useState({});
  const [emailByCourse, setEmailByCourse] = useState({});

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

  const fetchMeWithPlan = async () => {
    const meRes = await api.get("/auth/me");
    const base = meRes.data || {};

    let extra = {};
    try {
      const bRes = await api.get("/billing/status");
      extra = bRes.data || {};
    } catch {
      extra = {};
    }

    const merged = { ...base, ...extra };
    setMe(merged);
    return merged;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    if (checkout === "success") {
      fetchMeWithPlan().catch(() => {});
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
    // 
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const isPremium = (me?.plan || "free") === "premium" || !!me?.is_premium;
  const planLabel = (me?.plan || (me?.is_premium ? "premium" : "free")).toUpperCase();

  const premiumUntilText = me?.premium_until
    ? new Date(me.premium_until).toLocaleString()
    : "";

  const maxQuestions = isPremium ? 20 : 10;

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || null,
    [lessons, selectedLessonId]
  );


  const apiBase = api?.defaults?.baseURL || "";
  const fileLink = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (!apiBase) return url;
    if (apiBase.endsWith("/") && url.startsWith("/")) return apiBase.slice(0, -1) + url;
    return apiBase + url;
  };

  const refreshCourses = async () => {
    const cRes = await api.get("/courses/my");
    const list = cRes.data?.courses || [];
    setCourses(list);

    if (!list.length) {
      setSelectedCourseId(null);
      setOpenStudentsCourseId(null);
      return;
    }

    setSelectedCourseId((prev) => {
      if (!prev) return list[0].id;
      const stillExists = list.some((c) => c.id === prev);
      return stillExists ? prev : list[0].id;
    });
  };

  const refreshLessons = async (courseId) => {
    if (!courseId) {
      setLessons([]);
      setSelectedLessonId(null);
      return;
    }

    setLessonsLoading(true);
    try {
      const lRes = await api.get(`/lessons/course/${courseId}`);
      const list = lRes.data?.lessons || [];
      setLessons(list);

      setSelectedLessonId((prev) => {
        if (!list.length) return null;
        if (!prev) return list[0].id;
        const stillExists = list.some((l) => l.id === prev);
        return stillExists ? prev : list[0].id;
      });
    } catch {
      setLessons([]);
      setSelectedLessonId(null);
    } finally {
      setLessonsLoading(false);
    }
  };

  const refreshQuizzes = async (lessonId) => {
    if (!lessonId) {
      setQuizzes([]);
      return;
    }
    setQuizLoading(true);
    try {
      const qRes = await api.get(`/quizzes/lesson/${lessonId}`);
      setQuizzes(qRes.data?.quizzes || []);
    } catch {
      setQuizzes([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const loadQuiz = async (quizId) => {
    if (!quizId) return;
    setViewQuizLoading(true);
    setViewQuiz(null);
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setViewQuiz(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load quiz.");
    } finally {
      setViewQuizLoading(false);
    }
  };
const [progressCourseId, setProgressCourseId] = useState(null);
const [progressStudents, setProgressStudents] = useState([]);
const [progressLoading, setProgressLoading] = useState(false);
const [selectedStudentEmail, setSelectedStudentEmail] = useState("");
const [weekly, setWeekly] = useState(null);
const [weakTopics, setWeakTopics] = useState([]);
const [metric, setMetric] = useState("avg"); // avg or count

useEffect(() => {
  if (courses.length && !progressCourseId) setProgressCourseId(courses[0].id);
}, [courses, progressCourseId]);

const loadStudentsProgress = async (courseId) => {
  if (!courseId) return;
  setProgressLoading(true);
  try {
    const res = await api.get(`/teacher/course/${courseId}/students-progress`);
    setProgressStudents(res.data?.students || []);
    setSelectedStudentEmail("");
    setWeekly(null);
    setWeakTopics([]);
  } finally {
    setProgressLoading(false);
  }
};

const loadStudentWeekly = async (courseId, email) => {
  if (!courseId || !email) return;
  const res = await api.get(
    `/teacher/course/${courseId}/student/${encodeURIComponent(email)}/weekly-progress?weeks=8`
  );
  setWeekly(res.data);
};

const loadStudentWeakTopics = async (courseId, email) => {
  if (!courseId || !email) return;
  try {
    const res = await api.get(
      `/teacher/course/${courseId}/student/${encodeURIComponent(email)}/weak-topics`
    );
    setWeakTopics(res.data?.weak_topics || []);
  } catch {
    setWeakTopics([]);
  }
};

  const loadStudentsForCourse = async (courseId) => {
    if (!courseId) return;
    setStudentsLoadingByCourse((p) => ({ ...p, [courseId]: true }));
    setError("");

    try {
      const res = await api.get(`/courses/${courseId}/students`);
      setStudentsByCourse((p) => ({
        ...p,
        [courseId]: res.data?.students || [],
      }));
    } catch (e) {
      setStudentsByCourse((p) => ({ ...p, [courseId]: [] }));
      setError(e?.response?.data?.detail || "Failed to load students.");
    } finally {
      setStudentsLoadingByCourse((p) => ({ ...p, [courseId]: false }));
    }
  };

  const addStudentToCourse = async (courseId) => {
    const email = (emailByCourse[courseId] || "").trim();
    if (!email) {
      setError("Enter student email.");
      return;
    }

    setStudentsLoadingByCourse((p) => ({ ...p, [courseId]: true }));
    setError("");

    try {
      await api.post(`/courses/${courseId}/enroll-student`, {
        student_email: email,
      });
      setEmailByCourse((p) => ({ ...p, [courseId]: "" }));
      await loadStudentsForCourse(courseId);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to add student.");
      setStudentsLoadingByCourse((p) => ({ ...p, [courseId]: false }));
    }
  };

  const removeStudentFromCourse = async (courseId, email) => {
    if (!window.confirm(`Remove ${email} from this course?`)) return;

    setStudentsLoadingByCourse((p) => ({ ...p, [courseId]: true }));
    setError("");

    try {
      await api.delete(
        `/courses/${courseId}/students/${encodeURIComponent(email)}`
      );
      await loadStudentsForCourse(courseId);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to remove student.");
      setStudentsLoadingByCourse((p) => ({ ...p, [courseId]: false }));
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const meData = await fetchMeWithPlan();
        if (meData?.role !== "teacher") {
          window.location.href = "/login";
          return;
        }

        await refreshCourses();
      } catch {
        setError("Failed to load dashboard. Please login again.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshLessons(selectedCourseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  useEffect(() => {
    refreshQuizzes(selectedLessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLessonId]);

  const createCourse = async () => {
    const title = newTitle.trim();
    const subject = newSubject.trim();
    if (!title || !subject) {
      setError("Please enter course title and subject.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      await api.post("/courses", { title, subject });
      setNewTitle("");
      setNewSubject("");
      await refreshCourses();
      setActiveTab("courses");
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to create course.");
    } finally {
      setCreating(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;

    setError("");
    try {
      await api.delete(`/courses/${courseId}`);
      if (openStudentsCourseId === courseId) setOpenStudentsCourseId(null);
      await refreshCourses();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to delete course.");
    }
  };

  const createLesson = async () => {
    if (!selectedCourseId) {
      setError("Select a course first.");
      return;
    }
    if (!lessonTitle.trim() || !lessonTopic.trim()) {
      setError("Please fill lesson title and topic.");
      return;
    }

    setSavingLesson(true);
    setError("");

    try {
      await api.post("/lessons", {
        course_id: Number(selectedCourseId),
        title: lessonTitle.trim(),
        topic: lessonTopic.trim(),
        content_text: lessonContent.trim(),
      });

      setLessonTitle("");
      setLessonTopic("");
      setLessonContent("");
      await refreshLessons(selectedCourseId);
      setActiveTab("lessons");
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to save lesson.");
    } finally {
      setSavingLesson(false);
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;

    setError("");
    try {
      await api.delete(`/lessons/${lessonId}`);
      await refreshLessons(selectedCourseId);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to delete lesson.");
    }
  };

  const generateQuiz = async () => {
    if (!selectedLessonId) {
      setError("Select a lesson first.");
      return;
    }

    const requested = Number(genNum) || 5;
    const finalNum = Math.max(1, Math.min(maxQuestions, requested));

    setGenLoading(true);
    setError("");
    setGenResult(null);
    setViewQuiz(null);

    try {
      const res = await api.post(`/quizzes/generate/${selectedLessonId}`, {
        difficulty: genDifficulty,
        num_questions: finalNum,
      });

      setGenResult(res.data);
      await refreshQuizzes(selectedLessonId);
      setActiveTab("quizzes");
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to generate quiz.");
    } finally {
      setGenLoading(false);
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
        plan: "teacher_premium",
        interval: billingInterval,
      });

      const checkoutUrl = res.data?.checkout_url || res.data?.url;
      if (!checkoutUrl) throw new Error("Checkout URL not returned from backend.");

      window.location.href = checkoutUrl;
    } catch (e) {
      setBillingError(
        e?.response?.data?.detail ||
          e?.message ||
          "Failed to start checkout. Check billing backend endpoint."
      );
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="card dash-card p-3">Loading Teacher Dashboard...</div>
      </div>
    );
  }

  const displayName = me?.email ? me.email.split("@")[0] : "Teacher";
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

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="dash-header">
        <div className="dash-header-top">
          <div>
            <div className="dash-title">Teacher Panel</div>
            <div className="dash-muted">
              Welcome back, <b> Teacher {displayName}</b>{" "}
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
            className={`dash-tab ${activeTab === "lessons" ? "active" : ""}`}
            onClick={() => setActiveTab("lessons")}
            type="button"
          >
            📘 Lessons
          </button>

          <button
            className={`dash-tab ${activeTab === "quizzes" ? "active" : ""}`}
            onClick={() => setActiveTab("quizzes")}
            type="button"
          >
            📝 Quizzes
          </button>
            <button
              className={`dash-tab ${activeTab === "progress" ? "active" : ""}`}
              onClick={() => setActiveTab("progress")}
              type="button"
            >
              📈 Progress
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
              title="My Courses"
              value={courses.length}
              sub="Courses you teach"
              variant="purple"
            />
            <StatCard
              title="Lessons"
              value={lessons.length}
              sub={selectedCourse ? `In ${selectedCourse.title}` : "Total lessons"}
              variant="green"
            />
            <StatCard
              title="Quiz Limit"
              value={maxQuestions}
              sub={isPremium ? "Premium limit" : "Free plan limit"}
              variant="orange"
            />
            <StatCard
              title="Selected Course"
              value={selectedCourse ? "Yes" : "No"}
              sub={selectedCourse?.title || "Pick a course"}
              variant="blue"
            />
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12 col-lg-6">
              <div className="card dash-card dash-section dash-section--softblue h-100">
                <div className="card-body">
                  <h5 className="mb-2">Quick Actions</h5>

                  {courses.length === 0 ? (
                    <div className="dash-muted">Create a course first.</div>
                  ) : (
                    <>
                      <select
                        className="form-select"
                        value={selectedCourseId || ""}
                        onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.subject})
                          </option>
                        ))}
                      </select>

                      <div className="mt-3 d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-primary"
                          type="button"
                          onClick={() => setActiveTab("lessons")}
                        >
                          Manage Lessons
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={() => setActiveTab("quizzes")}
                        >
                          Manage Quizzes
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          type="button"
                          onClick={() => setActiveTab("courses")}
                        >
                          Manage Students
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
                  <h5 className="mb-2">Generate Quiz Quick</h5>

                  {lessonsLoading ? (
                    <div className="dash-muted">Loading lessons...</div>
                  ) : lessons.length === 0 ? (
                    <div className="dash-muted">No lessons yet in this course.</div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <label className="form-label">Lesson</label>
                        <select
                          className="form-select"
                          value={selectedLessonId || ""}
                          onChange={(e) => setSelectedLessonId(Number(e.target.value))}
                        >
                          {lessons.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.title} ({l.topic})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label">Difficulty</label>
                          <select
                            className="form-select"
                            value={genDifficulty}
                            onChange={(e) => setGenDifficulty(e.target.value)}
                          >
                            <option value="easy">easy</option>
                            <option value="medium">medium</option>
                            <option value="hard">hard</option>
                          </select>
                        </div>

                        <div className="col-6">
                          <label className="form-label">Questions</label>
                          <input
                            className="form-control"
                            type="number"
                            min={1}
                            max={maxQuestions}
                            value={genNum}
                            onChange={(e) => setGenNum(e.target.value)}
                          />
                          {!isPremium ? (
                            <div className="dash-muted" style={{ fontSize: 12, marginTop: 4 }}>
                              Free plan limited to 10 questions. Upgrade to Premium to get up to 20.
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <button
                        className="btn btn-primary mt-3"
                        type="button"
                        onClick={generateQuiz}
                        disabled={genLoading}
                      >
                        {genLoading ? "Generating..." : "Generate"}
                      </button>
                    </>
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
              <h5 className="mb-2">Courses</h5>

              <div className="row g-3">
                <div className="col-12 col-lg-5">
                  <div className="card dash-card h-100">
                    <div className="card-body">
                      <h6 className="mb-3">Create Course</h6>

                      <div className="mb-2">
                        <label className="form-label">Title</label>
                        <input
                          className="form-control"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g., Discrete Math"
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <input
                          className="form-control"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder="e.g., Mathematics"
                        />
                      </div>

                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={createCourse}
                        disabled={creating}
                      >
                        {creating ? "Creating..." : "Create Course"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-7">
                  {courses.length === 0 ? (
                    <div className="dash-muted">No courses yet.</div>
                  ) : (
                    <div className="row g-3">
                      {courses.map((c) => (
                        <div className="col-12 col-md-6" key={c.id}>
                          <div className="dash-course">
                            <div className="dash-course-title">{c.title}</div>
                            <div className="dash-muted">{c.subject}</div>
                            <div className="dash-muted mt-1">
                              Teacher: <b>{c.teacher_email}</b>
                            </div>

                            <div className="mt-2 d-flex gap-2 flex-wrap">
                              <button
                                className="btn btn-sm btn-primary"
                                type="button"
                                onClick={() => {
                                  setSelectedCourseId(c.id);
                                  setActiveTab("lessons");
                                }}
                              >
                                Lessons
                              </button>

                              <button
                                className="btn btn-sm btn-outline-primary"
                                type="button"
                                onClick={() => {
                                  setSelectedCourseId(c.id);
                                  setActiveTab("quizzes");
                                }}
                              >
                                Quizzes
                              </button>

                              <button
                                className="btn btn-sm btn-outline-secondary"
                                type="button"
                                onClick={async () => {
                                  const next =
                                    openStudentsCourseId === c.id ? null : c.id;
                                  setOpenStudentsCourseId(next);
                                  if (next) await loadStudentsForCourse(c.id);
                                }}
                              >
                                Students
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                type="button"
                                onClick={() => deleteCourse(c.id)}
                              >
                                Delete
                              </button>
                            </div>

                            {openStudentsCourseId === c.id && (
                              <div className="mt-3 p-3 border rounded">
                                <div className="fw-bold mb-2">
                                  Students in this course
                                </div>

                                <div className="d-flex gap-2 flex-wrap mb-2">
                                  <input
                                    className="form-control"
                                    style={{ maxWidth: 360 }}
                                    placeholder="student@email.com"
                                    value={emailByCourse[c.id] || ""}
                                    onChange={(e) =>
                                      setEmailByCourse((p) => ({
                                        ...p,
                                        [c.id]: e.target.value,
                                      }))
                                    }
                                  />

                                  <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={() => addStudentToCourse(c.id)}
                                    disabled={!!studentsLoadingByCourse[c.id]}
                                  >
                                    {studentsLoadingByCourse[c.id]
                                      ? "Please wait..."
                                      : "Add"}
                                  </button>

                                  <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => loadStudentsForCourse(c.id)}
                                    disabled={!!studentsLoadingByCourse[c.id]}
                                  >
                                    Refresh
                                  </button>
                                </div>

                                {studentsLoadingByCourse[c.id] ? (
                                  <div className="dash-muted">Loading...</div>
                                ) : (studentsByCourse[c.id] || []).length === 0 ? (
                                  <div className="dash-muted">
                                    No students enrolled yet.
                                  </div>
                                ) : (
                                  <div className="list-group">
                                    {(studentsByCourse[c.id] || []).map((s, idx) => (
                                      <div
                                        key={`${s.student_email}-${idx}`}
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                      >
                                        <span>{s.student_email}</span>
                                        <button
                                          className="btn btn-sm btn-outline-danger"
                                          type="button"
                                          onClick={() =>
                                            removeStudentFromCourse(
                                              c.id,
                                              s.student_email
                                            )
                                          }
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      type="button"
                      onClick={refreshCourses}
                    >
                      Refresh Courses
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "lessons" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softorange">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0">Lessons</h5>

                {courses.length > 0 && (
                  <select
                    className="form-select"
                    style={{ maxWidth: 360 }}
                    value={selectedCourseId || ""}
                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.subject})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="row g-3 mt-3">
                <div className="col-12 col-lg-5">
                  <div className="card dash-card h-100">
                    <div className="card-body">
                      <h6 className="mb-3">Create Lesson</h6>

                      <div className="mb-2">
                        <label className="form-label">Title</label>
                        <input
                          className="form-control"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          placeholder="e.g., Introduction"
                        />
                      </div>

                      <div className="mb-2">
                        <label className="form-label">Topic</label>
                        <input
                          className="form-control"
                          value={lessonTopic}
                          onChange={(e) => setLessonTopic(e.target.value)}
                          placeholder="e.g., Basic Concepts"
                        />
                      </div>

                      <div className="mb-2">
                        <label className="form-label">Upload file (optional)</label>
                        <input
                          className="form-control"
                          type="file"
                          accept=".txt,.md,.pdf,.png,.jpg,.jpeg"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const ext = file.name.split(".").pop().toLowerCase();

                            if (ext === "txt" || ext === "md") {
                              const reader = new FileReader();
                              reader.onload = () =>
                                setLessonContent(String(reader.result || ""));
                              reader.readAsText(file);
                              return;
                            }

                            try {
                              const fd = new FormData();
                              fd.append("file", file);

                              const res = await api.post("/lessons/upload", fd, {
                                headers: { "Content-Type": "multipart/form-data" },
                              });

                              const url = res.data?.url || res.data?.file_url || "";
                              if (url) {
                                setLessonContent((prev) => `${prev}\n\nAttachment: ${url}\n`);
                              }
                            } catch (err) {
                              setError(err?.response?.data?.detail || "File upload failed");
                            }
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Content</label>
                        <textarea
                          className="form-control"
                          rows={7}
                          value={lessonContent}
                          onChange={(e) => setLessonContent(e.target.value)}
                          placeholder="Lesson text here..."
                        />
                      </div>

                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={createLesson}
                        disabled={savingLesson}
                      >
                        {savingLesson ? "Saving..." : "Save Lesson"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-7">
                  <div className="card dash-card h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className="mb-3">Lessons List</h6>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          type="button"
                          onClick={() => refreshLessons(selectedCourseId)}
                        >
                          Refresh
                        </button>
                      </div>

                      {lessonsLoading ? (
                        <div className="dash-muted">Loading lessons...</div>
                      ) : lessons.length === 0 ? (
                        <div className="dash-muted">No lessons found for this course.</div>
                      ) : (
                        <div className="list-group">
                          {lessons.map((l) => (
                            <div key={l.id} className="list-group-item">
                              <div className="fw-bold">{l.title}</div>
                              <div className="dash-muted">{l.topic}</div>

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
                                  onClick={() => setSelectedLessonId(l.id)}
                                >
                                  View Lesson
                                </button>

                                <button
                                  className="btn btn-sm btn-primary"
                                  type="button"
                                  onClick={() => {
                                    setSelectedLessonId(l.id);
                                    setActiveTab("quizzes");
                                  }}
                                >
                                  Open Quizzes
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  type="button"
                                  onClick={() => deleteLesson(l.id)}
                                >
                                  Delete Lesson
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedLesson ? (
                        <div className="mt-3">
                          <div className="dash-muted mb-2">Selected Lesson</div>
                          <div
                            className="p-3"
                            style={{
                              border: "1px solid rgba(0,0,0,0.08)",
                              borderRadius: 12,
                            }}
                          >
                            <div className="fw-bold">{selectedLesson.title}</div>
                            <div className="dash-muted">Topic: {selectedLesson.topic}</div>

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
                              <div className="dash-muted mb-1">Lesson Content</div>
                              <div
                                className="p-3"
                                style={{
                                  border: "1px solid rgba(0,0,0,0.08)",
                                  borderRadius: 12,
                                  maxHeight: 260,
                                  overflow: "auto",
                                }}
                              >
                                <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
                                  {selectedLesson.content_text ||
                                    "No text content for this lesson."}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === "quizzes" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softblue">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0">Quizzes</h5>

                {courses.length > 0 && (
                  <select
                    className="form-select"
                    style={{ maxWidth: 360 }}
                    value={selectedCourseId || ""}
                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
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
                  <div className="dash-muted">No lessons yet. Add a lesson first.</div>
                ) : (
                  <div className="row g-3">
                    <div className="col-12 col-lg-5">
                      <div className="card dash-card h-100">
                        <div className="card-body">
                          <h6 className="mb-3">Generate Quiz</h6>

                          <div className="mb-2">
                            <label className="form-label">Lesson</label>
                            <select
                              className="form-select"
                              value={selectedLessonId || ""}
                              onChange={(e) => setSelectedLessonId(Number(e.target.value))}
                            >
                              {lessons.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.title} ({l.topic})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label">Difficulty</label>
                              <select
                                className="form-select"
                                value={genDifficulty}
                                onChange={(e) => setGenDifficulty(e.target.value)}
                              >
                                <option value="easy">easy</option>
                                <option value="medium">medium</option>
                                <option value="hard">hard</option>
                              </select>
                            </div>

                            <div className="col-6">
                              <label className="form-label">Questions</label>
                              <input
                                className="form-control"
                                type="number"
                                min={1}
                                max={maxQuestions}
                                value={genNum}
                                onChange={(e) => setGenNum(e.target.value)}
                              />
                              {!isPremium ? (
                                <div className="dash-muted" style={{ fontSize: 12, marginTop: 4 }}>
                                  Free plan up to 10 questions. Premium up to 20.
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <button
                            className="btn btn-primary mt-3"
                            type="button"
                            onClick={generateQuiz}
                            disabled={genLoading}
                          >
                            {genLoading ? "Generating..." : "Generate Quiz"}
                          </button>

                          <div className="dash-muted mt-2" style={{ fontSize: 12 }}>
                            Premium can generate bigger quizzes and better quality.
                          </div>
                        </div>
                      </div>

                      <div className="card dash-card mt-3">
                        <div className="card-body">
                          <h6 className="mb-3">Generated Preview</h6>
                          {!genResult?.questions?.length ? (
                            <div className="dash-muted">
                              Generate a quiz to preview here.
                            </div>
                          ) : (
                            <div className="list-group">
                              {genResult.questions.map((q, idx) => (
                                <div key={idx} className="list-group-item">
                                  <div className="fw-bold">
                                    {idx + 1}. {q.question}
                                  </div>
                                  <div className="mt-2">
                                    {(q.options || []).map((op, i) => (
                                      <div key={i}>
                                        {String.fromCharCode(65 + i)}. {op}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="dash-muted mt-2">
                                    Answer: {q.answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                      {selectedLesson ? (
                        <div className="card dash-card mt-3">
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between gap-2">
                              <div>
                                <div className="fw-bold">{selectedLesson.title}</div>
                                <div className="dash-muted">Topic: {selectedLesson.topic}</div>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                type="button"
                                onClick={() => setSelectedLessonId(null)}
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
                                  maxHeight: 260,
                                  overflow: "auto",
                                  background: "rgba(255,255,255,0.6)",
                                }}
                              >
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  skipHtml={true}
                                >
                                  {selectedLesson.content_text ||
                                    "No text content for this lesson."}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-7">
                      <div className="card dash-card h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="mb-3">Quizzes for Lesson</h6>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              type="button"
                              onClick={() => refreshQuizzes(selectedLessonId)}
                              disabled={!selectedLessonId}
                            >
                              Refresh
                            </button>
                          </div>

                          {quizLoading ? (
                            <div className="dash-muted">Loading quizzes...</div>
                          ) : quizzes.length === 0 ? (
                            <div className="dash-muted">No quizzes yet.</div>
                          ) : (
                            <div className="list-group mb-3">
                              {quizzes.map((q) => (
                                <button
                                  key={q.quiz_id}
                                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                  onClick={() => loadQuiz(String(q.quiz_id))}
                                  type="button"
                                >
                                  <span>
                                    Quiz #{q.quiz_id} • {q.difficulty}
                                  </span>
                                  <span className="dash-muted">{q.created_at}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {viewQuizLoading ? (
                            <div className="dash-muted">Loading quiz...</div>
                          ) : viewQuiz?.questions?.length ? (
                            <div>
                              <div className="dash-muted mb-2">
                                Viewing Quiz: <b>{viewQuiz.quiz_id}</b>
                              </div>

                              <div className="list-group">
                                {viewQuiz.questions.map((q, idx) => (
                                  <div key={idx} className="list-group-item">
                                    <div className="fw-bold">
                                      {idx + 1}. {q.question}
                                    </div>
                                    <div className="mt-2">
                                      {(q.options || []).map((op, i) => (
                                        <div key={i}>
                                          {String.fromCharCode(65 + i)}. {op}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="dash-muted mt-2">
                                      Answer: {q.answer}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
{activeTab === "progress" && (
  <div className="mt-3">
    <div className="card dash-card dash-section dash-section--softblue">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="mb-0">Student Progress</h5>

          {courses.length > 0 && (
            <div className="d-flex gap-2">
              <select
                className="form-select"
                style={{ maxWidth: 360 }}
                value={progressCourseId || ""}
                onChange={(e) => setProgressCourseId(Number(e.target.value))}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.subject})
                  </option>
                ))}
              </select>

              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => loadStudentsProgress(progressCourseId)}
              >
                Load
              </button>
            </div>
          )}
        </div>

        {progressLoading ? (
          <div className="dash-muted mt-3">Loading progress...</div>
        ) : progressStudents.length === 0 ? (
          <div className="dash-muted mt-3">
            Click Load to see students. Make sure students are enrolled and have attempted quizzes.
          </div>
        ) : (
          <div className="row g-3 mt-2">
            <div className="col-12 col-lg-5">
              <div className="card dash-card">
                <div className="card-body">
                  <h6 className="mb-2">Students</h6>

                  <div className="list-group">
                    {progressStudents.map((s) => (
                                          <button
                      key={s.student_email}
                      type="button"
                      className={`list-group-item list-group-item-action student-item ${
                        selectedStudentEmail === s.student_email ? "student-item--active" : ""
                      }`}
                      onClick={async () => {
                        setSelectedStudentEmail(s.student_email);
                        await loadStudentWeekly(progressCourseId, s.student_email);
                        await loadStudentWeakTopics(progressCourseId, s.student_email);
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="student-name">{s.student_email}</div>
                          <div className="student-sub">
                            Avg: {Math.round(s.avg_score)}% • Quizzes: {s.quizzes_done}
                          </div>
                        </div>

                        <span className={`badge ${s.last_attempt_at ? "bg-success" : "bg-secondary"}`}>
                          {s.last_attempt_at ? "Active" : "No attempt"}
                        </span>
                      </div>
                    </button>

                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="card dash-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h6 className="mb-0">Weekly Progress</h6>

                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-sm ${metric === "avg" ? "btn-primary" : "btn-outline-primary"}`}
                        type="button"
                        onClick={() => setMetric("avg")}
                      >
                        Avg Score
                      </button>
                      <button
                        className={`btn btn-sm ${metric === "count" ? "btn-primary" : "btn-outline-primary"}`}
                        type="button"
                        onClick={() => setMetric("count")}
                      >
                        Quizzes Done
                      </button>
                    </div>
                  </div>

                  {!selectedStudentEmail ? (
                    <div className="dash-muted mt-3">Select a student to view progress.</div>
                  ) : !weekly ? (
                    <div className="dash-muted mt-3">Loading chart...</div>
                  ) : (
                    <>
                      <div className="dash-muted mt-2">
                        Student: <b>{weekly.student_email}</b>
                      </div>

                      <div className="mt-3">
                        <BarChart
                          labels={weekly.weeks}
                          values={metric === "avg" ? weekly.avg_scores : weekly.quizzes_done}
                        />
                      </div>

                      <div className="mt-3">
                        <h6 className="mb-2">Weak Topics</h6>
                        {weakTopics.length === 0 ? (
                          <div className="dash-muted">No mastery topics yet.</div>
                        ) : (
                          <div className="list-group">
                            {weakTopics.map((t, i) => (
                              <div key={i} className="list-group-item">
                                <div className="fw-semibold">
                                  {t.subject} — {t.topic}
                                </div>
                                <div className="dash-muted" style={{ fontSize: 12 }}>
                                  Mastery: {Math.round(t.mastery_score)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
        <div className="dash-muted">
          Ask questions about lesson design, quiz difficulty, and teaching tips.
        </div>

        {/* Chat messages */}
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.text}
                  </ReactMarkdown>
                ) : (
                  <span>{m.text}</span>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="chat-bubble chat-bot">
                <div style={{ whiteSpace: "pre-wrap" }}>Typing...</div>
              </div>
            )}
          </div>
        </div>

        {/* Chat input */}
        <div className="chat-input mt-2">
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
          You are enjoing our leatest AI model!
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
              <div className="dash-note">Tip: Add lessons before generating quizzes.</div>
              <div className="dash-note">Tip: Enroll students into your courses.</div>
              <div className="dash-note">Reminder: Keep course content updated.</div>
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
                  <h5 className="mb-1">EduMate Teacher Premium</h5>
                  <div className="dash-muted">
                    Better quiz generation and stronger teacher AI assistant.
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
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>What you get</div>
                  <ul style={{ marginBottom: 0 }}>
                    <li>Generate up to 20 questions per quiz</li>
                    <li>Better quiz quality and structure</li>
                    <li>Advanced teacher AI assistant</li>
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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
