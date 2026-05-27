import { useEffect, useState } from 'react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { IconReport } from '../components/icons';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

export default function Reports() {
  const [viewDate, setViewDate] = useState(todayISO());
  const [filterClass, setFilterClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [reportLog, setReportLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    ReportDate: todayISO(),
    ReportType: 'Daily',
    Notes: '',
  });

  useEffect(() => {
    api('/api/classes/options')
      .then(setClasses)
      .catch(() => {});
  }, []);

  async function loadReports() {
    setLoading(true);
    setMsg('');
    try {
      const params = new URLSearchParams({ date: viewDate });
      if (filterClass) params.set('classId', filterClass);
      const [attendance, logs] = await Promise.all([
        api(`/api/reports/attendance?${params}`),
        api('/api/reports'),
      ]);
      setAttendanceRows(attendance.rows || []);
      setReportLog(logs);
    } catch (err) {
      setMsg(err.body?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [viewDate, filterClass]);

  async function saveReport(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/reports', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ ReportDate: todayISO(), ReportType: 'Daily', Notes: '' });
      setShowCreate(false);
      await loadReports();
    } catch (err) {
      setMsg(err.body?.error || err.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={IconReport}
        title="Reports"
        description="View daily attendance by date and class."
      >
        <button type="button" onClick={() => setShowCreate((v) => !v)} className="btn-secondary">
          {showCreate ? 'Close' : 'Log new report'}
        </button>
      </PageHeader>

      <div className="form-card flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">Report date</label>
          <input
            type="date"
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={viewDate}
            onChange={(e) => setViewDate(e.target.value)}
          />
        </div>
        <span className="inline-block">
          <label className="text-xs font-medium text-slate-600">Class</label>
          <select
            className="mt-1 block min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.ClassID} value={String(c.ClassID)}>
                {c.ClassName} ({c.AcademicYear})
              </option>
            ))}
          </select>
        </span>
        <button
          type="button"
          onClick={loadReports}
          className="btn-primary"
        >
          Refresh
        </button>
        <button
          type="button"
          className="no-print rounded-lg border border-slate-300 px-4 py-2 text-sm"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {showCreate && (
        <form onSubmit={saveReport} className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Log new report (optional)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Report date</label>
              <input
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.ReportDate}
                onChange={(e) => setForm({ ...form, ReportDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Report type</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.ReportType}
                onChange={(e) => setForm({ ...form, ReportType: e.target.value })}
              >
                <option>Daily</option>
                <option>Monthly</option>
                <option>Attendance slip</option>
                <option>Other</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-slate-600">Notes</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Optional description"
                value={form.Notes}
                onChange={(e) => setForm({ ...form, Notes: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Save report log
          </button>
        </form>
      )}

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Daily attendance report at {viewDate}</h3>
          <p className="text-xs text-slate-500">
            {filterClass
              ? `Filtered by class: ${classes.find((c) => String(c.ClassID) === filterClass)?.ClassName || filterClass}`
              : 'All classes'} Â· Student name, class name, attendance date, status
          </p>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Loading reportâ€¦</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Student name</th>
                <th className="px-4 py-3">Class name</th>
                <th className="px-4 py-3">Attendance date</th>
                <th className="px-4 py-3">Attendance status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{r.StudentName}</td>
                  <td className="px-4 py-3">{r.ClassName}</td>
                  <td className="px-4 py-3">{formatDate(r.AttendenceDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.AttendenceStatus} /></td>
                </tr>
              ))}
              {attendanceRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No attendance recorded for this date. Add attendance on the Attendances page first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Saved report log</h3>
          <p className="text-xs text-slate-500">Records stored in the Report table</p>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Report date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {reportLog.map((h) => (
              <tr key={h.ReportID} className="border-t border-slate-100">
                <td className="px-4 py-3">{h.ReportID}</td>
                <td className="px-4 py-3">{formatDate(h.ReportDate)}</td>
                <td className="px-4 py-3">{h.ReportType}</td>
                <td className="px-4 py-3 text-slate-600">{h.Notes || 'â€”'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {h.CreatedAt ? new Date(h.CreatedAt).toLocaleString() : 'â€”'}
                </td>
              </tr>
            ))}
            {!loading && reportLog.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No saved report logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
