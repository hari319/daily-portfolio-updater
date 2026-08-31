import React, { useState, useEffect } from 'react';
import { Clock, Check } from 'lucide-react';

export default function SchedulePanel({
  initialRunTimes = ['09:30', '11:30'],
  onSaveSchedule,
  disabled = false,
}) {
  const [time1, setTime1] = useState(initialRunTimes[0] || '09:30');
  const [time2, setTime2] = useState(initialRunTimes[1] || '11:30');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialRunTimes && initialRunTimes.length > 0) {
      setTime1(initialRunTimes[0] || '09:30');
      setTime2(initialRunTimes[1] || '11:30');
    }
  }, [initialRunTimes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSchedule([time1, time2]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-card p-3 h-100">
      <h3 className="panel-title">Scheduled Run Times</h3>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="row g-2">
          {/* Time 1 */}
          <div className="col-12 col-sm-4">
            <input
              type="time"
              className="form-control form-control-sm"
              value={time1}
              onChange={(e) => setTime1(e.target.value)}
              required
              disabled={disabled || isSaving}
              aria-label="First scheduled run time"
            />
          </div>

          {/* Time 2 */}
          <div className="col-12 col-sm-4">
            <input
              type="time"
              className="form-control form-control-sm"
              value={time2}
              onChange={(e) => setTime2(e.target.value)}
              required
              disabled={disabled || isSaving}
              aria-label="Second scheduled run time"
            />
          </div>

          {/* Save Button */}
          <div className="col-12 col-sm-4">
            <button
              type="submit"
              className="btn btn-outline-secondary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1"
              disabled={disabled || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Clock size={14} />
                  <span>Save times</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="field-hint">
          Saved to <code>config/settings.json</code> and synced to Windows Task Scheduler.
        </p>
      </form>
    </div>
  );
}
