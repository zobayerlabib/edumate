//src/pages/AdminDashboard.js


import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | users | courses | reports | settings | profile
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("edumate_theme") === "dark"
  );

  const [me, setMe] = useState(null);

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
  });

  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [roleSavingId, setRoleSavingId] = useState(null);

  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseQuery, setCourseQuery] = useState("");

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

  const loadStats = async () => {
    setStatsLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/stats");
      setStats({
        totalUsers: res.data?.totalUsers ?? 0,
        totalStudents: res.data?.totalStudents ?? 0,
        totalTeachers: res.data?.totalTeachers ?? 0,
        totalCourses: res.data?.totalCourses ?? 0,
      });
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load stats.");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users");
      const list = Array.isArray(res.data) ? res.data : [];
      setUsers(list);

      const drafts = {};
      for (const u of list) drafts[u.id] = u.role;
      setRoleDrafts(drafts);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load users.");
      setUsers([]);
      setRoleDrafts({});
    } finally {
      setUsersLoading(false);
    }
  };

  const saveUserRole = async (userId) => {
    const role = roleDrafts[userId];
    if (!role) return;

    setRoleSavingId(userId);
    setError("");
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      await loadUsers();
      await loadStats();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to update role.");
    } finally {
      setRoleSavingId(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;

    setError("");
    try {
      await api.delete(`/admin/users/${userId}`);
      await loadUsers();
      await loadStats();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to delete user.");
    }
  };

  const loadCourses = async () => {
    setCoursesLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/courses");
      setCourses(res.data?.courses || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load courses.");
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const adminDeleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;

    setError("");
    try {
      await api.delete(`/admin/courses/${courseId}`);
      await loadCourses();
      await loadStats();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to delete course.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const meRes = await api.get("/auth/me");
        if (meRes.data?.role !== "admin") {
          window.location.href = "/login";
          return;
        }
        setMe(meRes.data);
        await loadStats();
      } catch (e) {
        setError("Failed to load admin dashboard. Please login again.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "dashboard") loadStats();
    if (activeTab === "users") loadUsers();
    if (activeTab === "courses") loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const displayName = me?.email ? me.email.split("@")[0] : "Admin";

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const t = String(c.title || "").toLowerCase();
      const s = String(c.subject || "").toLowerCase();
      const e = String(c.teacher_email || "").toLowerCase();
      return t.includes(q) || s.includes(q) || e.includes(q);
    });
  }, [courses, courseQuery]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="card dash-card p-3">Loading Admin Dashboard...</div>
      </div>
    );
  }

  if (error && !me) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="dash-header">
        <div className="dash-header-top">
          <div>
            <div className="dash-title">Admin Panel</div>
            <div className="dash-muted">
              Welcome back, <b>{displayName}</b> <span className="wave">👋</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
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
          >
            📊 Dashboard
          </button>

          <button
            className={`dash-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 Users
          </button>

          <button
            className={`dash-tab ${activeTab === "courses" ? "active" : ""}`}
            onClick={() => setActiveTab("courses")}
          >
            📚 Courses
          </button>

          <button
            className={`dash-tab ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            📈 Reports
          </button>

          <button
            className={`dash-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings
          </button>

          <button
            className={`dash-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            🧑‍💻 Profile
          </button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div className="row g-3 mt-3">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              sub="All accounts"
              variant="blue"
            />
            <StatCard
              title="Students"
              value={stats.totalStudents}
              sub="Registered students"
              variant="green"
            />
            <StatCard
              title="Teachers"
              value={stats.totalTeachers}
              sub="Registered teachers"
              variant="purple"
            />
            <StatCard
              title="Courses"
              value={stats.totalCourses}
              sub="Total courses"
              variant="orange"
            />
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12 col-lg-6">
              <div className="card dash-card dash-section dash-section--softblue h-100">
                <div className="card-body">
                  <h5 className="mb-2">Quick Admin Actions</h5>
                  <div className="dash-muted">
                    Manage users and courses from the tabs above.
                  </div>

                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setActiveTab("users")}
                    >
                      Manage Users
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setActiveTab("courses")}
                    >
                      Manage Courses
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={loadStats}
                      disabled={statsLoading}
                    >
                      {statsLoading ? "Refreshing..." : "Refresh Stats"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card dash-card dash-section dash-section--softpurple h-100">
                <div className="card-body">
                  <h5 className="mb-2">System Status</h5>
                  <div className="dash-note">API: Running</div>
                  <div className="dash-note">Database: Connected</div>
                  <div className="dash-note">Uploads: /uploads</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softgreen">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-2">Users Management</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadUsers}
                  disabled={usersLoading}
                >
                  {usersLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {usersLoading ? (
                <div className="dash-muted">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="dash-muted">No users found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th>Email</th>
                        <th style={{ width: 180 }}>Role</th>
                        <th style={{ width: 220 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.email}</td>
                          <td>
                            <select
                              className="form-select"
                              value={roleDrafts[u.id] || u.role}
                              onChange={(e) =>
                                setRoleDrafts((p) => ({
                                  ...p,
                                  [u.id]: e.target.value,
                                }))
                              }
                              disabled={roleSavingId === u.id}
                            >
                              <option value="student">student</option>
                              <option value="teacher">teacher</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => saveUserRole(u.id)}
                              disabled={roleSavingId === u.id}
                            >
                              {roleSavingId === u.id ? "Saving..." : "Save"}
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteUser(u.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softorange">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-2">Courses Management</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadCourses}
                  disabled={coursesLoading}
                >
                  {coursesLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <input
                    className="form-control"
                    placeholder="Search course title / subject / teacher email"
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                  />
                </div>
              </div>

              {coursesLoading ? (
                <div className="dash-muted">Loading courses...</div>
              ) : filteredCourses.length === 0 ? (
                <div className="dash-muted">No courses found.</div>
              ) : (
                <div className="row g-3">
                  {filteredCourses.map((c) => (
                    <div className="col-12 col-md-6 col-xl-4" key={c.id}>
                      <div className="dash-course">
                        <div className="dash-course-title">{c.title}</div>
                        <div className="dash-muted">{c.subject}</div>
                        <div className="dash-muted mt-1">
                          Teacher: <b>{c.teacher_email}</b>
                        </div>

                        <div className="mt-2 d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => adminDeleteCourse(c.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softblue">
            <div className="card-body">
              <h5 className="mb-2">Reports</h5>
              <div className="dash-muted">
                Add later: quiz attempts per course, performance summaries, active
                users.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softpurple">
            <div className="card-body">
              <h5 className="mb-2">Settings</h5>
              <div className="dash-muted">
                Add later: maintenance mode, AI limits, storage checks.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="mt-3">
          <div className="card dash-card dash-section dash-section--softpurple">
            <div className="card-body">
              <h5 className="mb-2">Profile</h5>
              <div className="dash-muted">
                Email: <b>{me?.email}</b>
              </div>
              <div className="dash-muted">
                Role: <b>{me?.role}</b>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
