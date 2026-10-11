import { useEffect, useMemo, useState } from "react";
import "./careerpilot.css";

const API = import.meta.env.VITE_API_URL || "/api";
const statuses = ["Applied", "Interview", "Offer", "Rejected", "Wishlist"];
const emptyForm = {
  company: "",
  role: "",
  location: "",
  jobUrl: "",
  status: "Applied",
  appliedAt: new Date().toISOString().slice(0, 10),
  notes: "",
};
const initialAnalytics = {
  total: 0,
  active: 0,
  interviews: 0,
  offers: 0,
  byStatus: Object.fromEntries(statuses.map((s) => [s, 0])),
};
const todayLabel = new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const currentYear = new Date().getFullYear();

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
const Icon = ({ name, size = 18 }) => {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
    edit: (
      <>
        <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12M6 6l12 12" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    briefcaseSmall: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

function App() {
  const [page, setPage] = useState("Overview");
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [jd, setJd] = useState("");
  const [skills, setSkills] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const refresh = async () => {
    try {
      const [a, stats] = await Promise.all([
        request("/applications"),
        request("/analytics"),
      ]);
      setApplications(a.applications);
      setAnalytics(stats);
      setError("");
    } catch (e) {
      setError(e.message);
      setApplications([]);
      setAnalytics(initialAnalytics);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- initial state syncs with the API response
    refresh();
  }, []);
  const filtered = useMemo(
    () =>
      applications.filter(
        (a) =>
          (filter === "All statuses" || a.status === filter) &&
          `${a.company} ${a.role} ${a.location}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [applications, filter, query],
  );
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };
  const openEdit = (app) => {
    setEditing(app);
    setForm({
      ...emptyForm,
      ...app,
      appliedAt: app.appliedAt
        ? new Date(app.appliedAt).toISOString().slice(0, 10)
        : emptyForm.appliedAt,
    });
    setModal(true);
  };
  const saveApplication = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await request(
        editing ? `/applications/${editing._id}` : "/applications",
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) },
      );
      setModal(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const deleteApplication = async (id) => {
    if (!window.confirm("Delete this application? This cannot be undone."))
      return;
    try {
      await request(`/applications/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };
  const runAnalysis = async (event) => {
    event.preventDefault();
    setAnalyzing(true);
    setAnalysis(null);
    try {
      setAnalysis(
        await request("/analyze", {
          method: "POST",
          body: JSON.stringify({ jobDescription: jd, candidateSkills: skills }),
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };
  const nav = [
    ["Overview", "grid"],
    ["Applications", "briefcase"],
    ["Skill match", "spark"],
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setPage("Overview");
          }}
        >
          <span className="brand-mark">
            <Icon name="spark" size={19} />
          </span>
          <span>
            career<span className="brand-light">pilot</span>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {nav.map(([label, icon]) => (
            <button
              key={label}
              aria-label={label}
              title={label}
              className={`nav-link ${page === label ? "active" : ""}`}
              onClick={() => setPage(label)}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {label === "Applications" && applications.length > 0 && (
                <span className="nav-count">{applications.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">
              <Icon name="spark" size={16} />
            </div>
            <strong>Small steps add up.</strong>
            <p>
              Track each application and keep your job search moving forward.
            </p>
            <button onClick={() => setPage("Applications")}>
              View your tracker <span>→</span>
            </button>
          </div>
          <div className="profile">
            <div className="avatar">CP</div>
            <div>
              <strong>My workspace</strong>
              <span>Personal account</span>
            </div>
            <span className="profile-dots">···</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <b>{page}</b>
          </div>
          <div className="topbar-right">
            <span className="today">
              <Icon name="calendar" size={15} />
              {todayLabel}
            </span>
            <div className="avatar avatar-small">CP</div>
          </div>
        </header>
        <div className="page-content">
          {error && (
            <div className="alert" role="alert">
              <span>
                <b>Connection notice</b> · {error}
              </span>
              <button aria-label="Dismiss" onClick={() => setError("")}>
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {page === "Overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">YOUR CAREER, IN MOTION</div>
                  <h1>
                    A clearer path to your <span>next role.</span>
                  </h1>
                  <p className="subhead">
                    Keep every opportunity organized and make your next move
                    with confidence.
                  </p>
                </div>
                <button className="button button-primary" onClick={openCreate}>
                  <Icon name="plus" size={17} /> Add application
                </button>
              </section>
              <section
                className="stats-grid"
                aria-label="Application analytics"
              >
                <article className="stat-card">
                  <div className="stat-label">
                    Total applications{" "}
                    <span className="stat-icon indigo">
                      <Icon name="briefcaseSmall" />
                    </span>
                  </div>
                  <strong className="stat-number">{analytics.total}</strong>
                  <div className="stat-foot">Across your job search</div>
                  <div className="mini-bars">
                    {[30, 48, 38, 65, 42, 80, 54, 72, 50, 92, 68, 100].map(
                      (h, i) => (
                        <i key={i} style={{ height: `${h}%` }} />
                      ),
                    )}
                  </div>
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    In progress{" "}
                    <span className="stat-icon blue">
                      <Icon name="arrow" />
                    </span>
                  </div>
                  <strong className="stat-number">{analytics.active}</strong>
                  <div className="stat-foot">Applied or interviewing</div>
                  <div className="stat-accent-line blue-line" />
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    Interviews{" "}
                    <span className="stat-icon amber">
                      <span className="dot-icon">✳</span>
                    </span>
                  </div>
                  <strong className="stat-number">
                    {analytics.interviews}
                  </strong>
                  <div className="stat-foot">Conversations in motion</div>
                  <div className="stat-accent-line amber-line" />
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    Offers{" "}
                    <span className="stat-icon green">
                      <Icon name="check" />
                    </span>
                  </div>
                  <strong className="stat-number">{analytics.offers}</strong>
                  <div className="stat-foot">Here’s to what’s next</div>
                  <div className="stat-accent-line green-line" />
                </article>
              </section>
              <section className="dashboard-grid">
                <article className="panel status-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Application pipeline</h2>
                      <p>A snapshot of where things stand.</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setPage("Applications")}
                    >
                      View tracker <span>→</span>
                    </button>
                  </div>
                  <div className="pipeline-list">
                    {statuses.map((status) => {
                      const count = analytics.byStatus?.[status] || 0;
                      const pct = analytics.total
                        ? (count / analytics.total) * 100
                        : 0;
                      return (
                        <div className="pipeline-row" key={status}>
                          <div className="pipeline-label">
                            <span
                              className={`status-dot ${status.toLowerCase()}`}
                            />
                            <span>{status}</span>
                            <b>{count}</b>
                          </div>
                          <div className="progress-track">
                            <i
                              className={`progress-fill ${status.toLowerCase()}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pipeline-total">
                    <span>Total opportunities</span>
                    <strong>{analytics.total}</strong>
                  </div>
                </article>
                <article className="panel next-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your next move</h2>
                      <p>A little progress goes a long way.</p>
                    </div>
                  </div>
                  <div className="next-illustration">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="orbit-center">
                      <Icon name="spark" size={28} />
                    </div>
                    <span className="orbit-dot dot-a" />
                    <span className="orbit-dot dot-b" />
                    <span className="orbit-dot dot-c" />
                  </div>
                  <div className="next-copy">
                    <strong>Make your next application count.</strong>
                    <p>
                      Compare your skills with a job description and find where
                      to focus next.
                    </p>
                  </div>
                  <button
                    className="button button-soft"
                    onClick={() => setPage("Skill match")}
                  >
                    <Icon name="spark" size={16} /> Try skill match{" "}
                    <span>→</span>
                  </button>
                </article>
              </section>
              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent applications</h2>
                    <p>Your latest opportunities, all in one place.</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setPage("Applications")}
                  >
                    See all applications <span>→</span>
                  </button>
                </div>
                <ApplicationTable
                  items={applications.slice(0, 4)}
                  loading={loading}
                  onEdit={openEdit}
                  onDelete={deleteApplication}
                />
              </section>
            </>
          )}
          {page === "Applications" && (
            <>
              <section className="welcome-row page-title-row">
                <div>
                  <div className="eyebrow">YOUR OPPORTUNITIES</div>
                  <h1>
                    Application tracker<span>.</span>
                  </h1>
                  <p className="subhead">
                    Every role, every update, right where you need it.
                  </p>
                </div>
                <button className="button button-primary" onClick={openCreate}>
                  <Icon name="plus" size={17} /> Add application
                </button>
              </section>
              <section className="panel tracker-panel">
                <div className="tracker-toolbar">
                  <div className="search-box">
                    <Icon name="search" size={17} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search company or role"
                      aria-label="Search applications"
                    />
                  </div>
                  <select
                    className="filter-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    aria-label="Filter by status"
                  >
                    <option>All statuses</option>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <span className="result-count">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "application" : "applications"}
                  </span>
                </div>
                <ApplicationTable
                  items={filtered}
                  loading={loading}
                  onEdit={openEdit}
                  onDelete={deleteApplication}
                />
              </section>
            </>
          )}
          {page === "Skill match" && (
            <>
              <section className="welcome-row page-title-row">
                <div>
                  <div className="eyebrow">A SMARTER WAY TO PREPARE</div>
                  <h1>
                    Find your skill match<span>.</span>
                  </h1>
                  <p className="subhead">
                    See what already fits and where to focus next.
                  </p>
                </div>
                <span className="privacy-note">
                  <span /> Analyzes privately on your server
                </span>
              </section>
              <section className="analyzer-layout">
                <form className="panel analyzer-form" onSubmit={runAnalysis}>
                  <div className="panel-heading">
                    <div>
                      <h2>Compare your experience</h2>
                      <p>Paste a job description and list your skills.</p>
                    </div>
                    <span className="step-pill">01 — INPUT</span>
                  </div>
                  <label className="field-label" htmlFor="job-description">
                    Job description <span>Required</span>
                  </label>
                  <textarea
                    id="job-description"
                    className="textarea jd-area"
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    minLength={30}
                    maxLength={10000}
                    placeholder="Paste the responsibilities and requirements from the job listing..."
                    required
                  />
                  <div className="field-meta">
                    <span>{jd.length}/10,000 characters</span>
                    <span>At least 30 characters</span>
                  </div>
                  <label
                    className="field-label skills-label"
                    htmlFor="your-skills"
                  >
                    Your skills <span>Comma separated</span>
                  </label>
                  <textarea
                    id="your-skills"
                    className="textarea skills-area"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    maxLength={2000}
                    placeholder="e.g. React, JavaScript, Node.js, Figma"
                    required
                  />
                  <button
                    className="button button-primary analyze-button"
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <>
                        <span className="spinner" /> Analyzing…
                      </>
                    ) : (
                      <>
                        <Icon name="spark" size={17} /> Analyze skill match{" "}
                        <span>→</span>
                      </>
                    )}
                  </button>
                  <p className="form-footnote">
                    Your text is processed by this app's API and isn't sent to a
                    third-party AI service.
                  </p>
                </form>
                <div className="panel result-panel">
                  {analysis ? (
                    <>
                      <div className="panel-heading">
                        <div>
                          <h2>Your match snapshot</h2>
                          <p>Based on skills found in this description.</p>
                        </div>
                        <span className="step-pill">02 — RESULTS</span>
                      </div>
                      <div className="score-row">
                        <div
                          className="score-ring"
                          style={{ "--score": `${analysis.score ?? 0}%` }}
                        >
                          <div>
                            {analysis.score === null
                              ? "—"
                              : `${analysis.score}%`}
                            <span>match</span>
                          </div>
                        </div>
                        <div className="score-copy">
                          <strong>
                            {analysis.score === null
                              ? "Not enough signals yet"
                              : analysis.score >= 75
                                ? "Strong alignment"
                                : analysis.score >= 45
                                  ? "A promising foundation"
                                  : "Room to build"}
                          </strong>
                          <p>{analysis.explanation}</p>
                        </div>
                      </div>
                      <div className="skill-groups">
                        <div>
                          <div className="group-title">
                            <span className="status-dot offer" /> Matched skills{" "}
                            <b>{analysis.matchedSkills.length}</b>
                          </div>
                          <div className="chips">
                            {analysis.matchedSkills.length ? (
                              analysis.matchedSkills.map((s) => (
                                <span className="skill-chip matched" key={s}>
                                  <Icon name="check" size={13} />
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="empty-copy">
                                No matching skills found yet.
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="group-title">
                            <span className="status-dot rejected" /> Skills to
                            explore <b>{analysis.missingSkills.length}</b>
                          </div>
                          <div className="chips">
                            {analysis.missingSkills.length ? (
                              analysis.missingSkills.map((s) => (
                                <span className="skill-chip missing" key={s}>
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="empty-copy">
                                No gaps among detected skills.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="suggestions">
                        <strong>
                          <Icon name="spark" size={16} /> A few ideas for your
                          next step
                        </strong>
                        <ul>
                          {analysis.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="analysis-note">{analysis.note}</p>
                    </>
                  ) : (
                    <div className="result-empty">
                      <div className="empty-art">
                        <div className="empty-ring ring-a" />
                        <div className="empty-ring ring-b" />
                        <div className="empty-star">
                          <Icon name="spark" size={25} />
                        </div>
                        <span className="float-chip chip-one">React</span>
                        <span className="float-chip chip-two">✦ Skills</span>
                        <span className="float-chip chip-three">+ Match</span>
                      </div>
                      <span className="step-pill">02 — RESULTS</span>
                      <h2>Your insight starts here.</h2>
                      <p>
                        Run an analysis to see your strengths, skill gaps, and
                        practical next steps for this role.
                      </p>
                      <div className="empty-check">
                        <Icon name="check" size={14} /> Clear, explainable
                        results
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
          <footer className="footer">
            <span>© {currentYear} CareerPilot</span>
            <span>
              One thoughtful step at a time{" "}
              <span className="footer-heart">✳</span>
            </span>
          </footer>
        </div>
      </main>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <form className="modal" onSubmit={saveApplication}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">
                  {editing ? "KEEP YOUR TRACKER CURRENT" : "A NEW OPPORTUNITY"}
                </div>
                <h2>{editing ? "Update application" : "Add an application"}</h2>
                <p>
                  {editing
                    ? "Make changes to your saved opportunity."
                    : "Add a few details to get this opportunity on your radar."}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(false)}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Company{" "}
                <input
                  required
                  maxLength="100"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="e.g. Linear"
                />
              </label>
              <label>
                Role{" "}
                <input
                  required
                  maxLength="120"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Software Engineer Intern"
                />
              </label>
              <label>
                Location{" "}
                <input
                  maxLength="120"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Remote or city"
                />
              </label>
              <label>
                Status{" "}
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Applied on{" "}
                <input
                  type="date"
                  value={form.appliedAt}
                  onChange={(e) =>
                    setForm({ ...form, appliedAt: e.target.value })
                  }
                />
              </label>
              <label>
                Job link{" "}
                <input
                  type="url"
                  maxLength="500"
                  value={form.jobUrl}
                  onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                  placeholder="https://"
                />
              </label>
              <label className="wide-field">
                Notes{" "}
                <textarea
                  maxLength="2000"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="A detail you want to remember..."
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving ? (
                  "Saving…"
                ) : editing ? (
                  "Save changes"
                ) : (
                  <>
                    <Icon name="plus" size={16} /> Add application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ApplicationTable({ items, loading, onEdit, onDelete }) {
  if (loading)
    return (
      <div className="table-state">
        <span className="spinner" /> Loading your applications…
      </div>
    );
  if (!items.length)
    return (
      <div className="table-state empty-table">
        <div className="empty-icon">
          <Icon name="briefcase" size={21} />
        </div>
        <strong>No applications here yet</strong>
        <span>Once you add an opportunity, it’ll show up right here.</span>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>COMPANY & ROLE</th>
            <th>LOCATION</th>
            <th>APPLIED</th>
            <th>STATUS</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((app) => (
            <tr key={app._id}>
              <td>
                <div className="company-cell">
                  <div
                    className={`company-logo logo-${(app.company || "c").charCodeAt(0) % 5}`}
                  >
                    {(app.company || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <strong>{app.company}</strong>
                    <span>
                      {app.role}{" "}
                      {app.jobUrl && (
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open job posting"
                        >
                          <Icon name="arrow" size={12} />
                        </a>
                      )}
                    </span>
                  </div>
                </div>
              </td>
              <td className="location-cell">
                {app.location ? (
                  <>
                    <Icon name="pin" size={14} />
                    {app.location}
                  </>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td className="date-cell">
                {app.appliedAt
                  ? new Date(app.appliedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td>
                <span className={`status-badge ${app.status.toLowerCase()}`}>
                  <i />
                  {app.status}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Edit ${app.company}`}
                    onClick={() => onEdit(app)}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    className="icon-button danger-action"
                    aria-label={`Delete ${app.company}`}
                    onClick={() => onDelete(app._id)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default App;
