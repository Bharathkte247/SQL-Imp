"""
Unit tests for Login→Logout loginTime / breakTime rules.

Mirrors the session-clipping logic in agent_utilization.sql:
  - loginTime = seconds in [Login, Logout)
  - Offline between Login and Logout counts toward loginTime and breakTime
  - Offline after Logout counts toward neither
  - firstam: available after offline also starts a session; available = active
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class StatusEvent:
    ts_ms: int
    status: str
    previous_status: str = ""


LOGIN_EXPLICIT = {
    "login",
    "logged in",
    "loggedin",
    "logged_in",
}
LOGIN_PRESENCE = {"available", "online", "active"}
# Empty previous is NOT enough to start a session on available/active
# (would re-split on every Active with missing prev). firstam uses prev=offline.
PREV_OFFLINE = {"offline", "unavailable"}
LOGOUT_STATUSES = {
    "logout",
    "logged out",
    "loggedout",
    "logged_out",
}
BREAK_STATUSES = {"unavailable", "offline"}
ACTIVE_STATUSES = {
    "available",
    "online",
    "active",
    "login",
    "logged in",
    "loggedin",
    "logged_in",
}


def _norm(status: str) -> str:
    return status.strip().lower()


def is_login_event(status: str, previous_status: str = "") -> bool:
    st = _norm(status)
    prev = _norm(previous_status)
    if st in LOGIN_EXPLICIT:
        return True
    return st in LOGIN_PRESENCE and prev in PREV_OFFLINE


def session_number(events: list[StatusEvent]) -> list[int]:
    n = 0
    out: list[int] = []
    for e in events:
        if is_login_event(e.status, e.previous_status):
            n += 1
        out.append(n)
    return out


def logout_epoch(events: list[StatusEvent], session_nums: list[int], session: int) -> int | None:
    logout_ts = [
        e.ts_ms
        for e, sn in zip(events, session_nums)
        if sn == session and _norm(e.status) in LOGOUT_STATUSES
    ]
    return min(logout_ts) if logout_ts else None


def status_segments(
    events: list[StatusEvent],
    session_nums: list[int],
    session: int,
    *,
    now_ms: int | None = None,
) -> list[tuple[int, int, str]]:
    """Return (start_ms, end_ms, status) clipped to [Login, Logout)."""
    session_events = [(e, sn) for e, sn in zip(events, session_nums) if sn == session]
    if not session_events:
        return []

    logout = logout_epoch(events, session_nums, session)
    raw: list[tuple[int, int, str]] = []
    for i, (e, _) in enumerate(session_events):
        start = e.ts_ms
        if i + 1 < len(session_events):
            end = session_events[i + 1][0].ts_ms
        else:
            end = 0
        raw.append((start, end, e.status))

    clipped: list[tuple[int, int, str]] = []
    for start, end, status in raw:
        if logout is not None and start >= logout:
            continue
        if logout is not None and (end == 0 or end > logout):
            end = logout
        elif end == 0:
            if now_ms is None:
                continue
            end = now_ms
        if end > start + 86_400_000:
            end = start + 86_400_000
        if end <= start:
            continue
        clipped.append((start, end, status))
    return clipped


def expand_seconds(segments: list[tuple[int, int, str]]) -> list[tuple[int, str]]:
    seconds: list[tuple[int, str]] = []
    for start_ms, end_ms, status in segments:
        start_s = start_ms // 1000
        end_s = end_ms // 1000
        if end_s - start_s > 86_400:
            end_s = start_s + 86_400
        for s in range(start_s, end_s):
            seconds.append((s, status))
    return seconds


def compute_metrics(
    events: list[StatusEvent], *, now_ms: int | None = None
) -> dict[str, int]:
    sns = session_number(events)
    sessions = sorted({sn for sn in sns if sn > 0})
    all_seconds: list[tuple[int, str]] = []
    for sn in sessions:
        segs = status_segments(events, sns, sn, now_ms=now_ms)
        all_seconds.extend(expand_seconds(segs))

    login_time = len({s for s, _ in all_seconds})
    break_time = len({s for s, st in all_seconds if _norm(st) in BREAK_STATUSES})
    active_time = len({s for s, st in all_seconds if _norm(st) in ACTIVE_STATUSES})
    busy_time = len({s for s, st in all_seconds if _norm(st) in {"busy", "passive"}})
    return {
        "loginTime": login_time,
        "breakTime": break_time,
        "activeTime": active_time,
        "busyTime": busy_time,
    }


def test_offline_between_login_and_logout_counts_for_both():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "Active"),
        StatusEvent(20_000, "offline"),
        StatusEvent(30_000, "Active"),
        StatusEvent(40_000, "Logout"),
        StatusEvent(50_000, "offline"),
        StatusEvent(60_000, "offline"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 40, metrics
    assert metrics["breakTime"] == 10, metrics


def test_offline_after_logout_excluded_from_login_and_break():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "Logout"),
        StatusEvent(10_000, "offline"),
        StatusEvent(20_000, "offline"),
        StatusEvent(100_000, "offline"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 10, metrics
    assert metrics["breakTime"] == 0, metrics


def test_offline_is_not_treated_as_logout():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(5_000, "offline"),
        StatusEvent(15_000, "Active"),
        StatusEvent(25_000, "Logout"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 25, metrics
    assert metrics["breakTime"] == 10, metrics


def test_pre_login_offline_excluded():
    events = [
        StatusEvent(0_000, "offline"),
        StatusEvent(10_000, "Login"),
        StatusEvent(20_000, "Logout"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 10, metrics
    assert metrics["breakTime"] == 0, metrics


def test_two_sessions_clip_independently():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "offline"),
        StatusEvent(20_000, "Logout"),
        StatusEvent(30_000, "offline"),
        StatusEvent(40_000, "Login"),
        StatusEvent(50_000, "Active"),
        StatusEvent(60_000, "Logout"),
        StatusEvent(70_000, "offline"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 40, metrics
    assert metrics["breakTime"] == 10, metrics


def session_windows(events: list[StatusEvent]) -> list[tuple[int, int, int | None]]:
    sns = session_number(events)
    starts: dict[int, int] = {}
    for e, sn in zip(events, sns):
        if sn <= 0:
            continue
        starts[sn] = min(starts.get(sn, e.ts_ms), e.ts_ms)
    ordered = sorted(starts.items())
    windows: list[tuple[int, int, int | None]] = []
    for i, (sn, start) in enumerate(ordered):
        next_start = ordered[i + 1][1] if i + 1 < len(ordered) else None
        windows.append((sn, start, next_start))
    return windows


def assign_session(windows: list[tuple[int, int, int | None]], ts_ms: int) -> int | None:
    for sn, start, end in windows:
        if ts_ms < start:
            continue
        if end is None or ts_ms < end:
            return sn
    return None


def test_session_window_join_matches_containing_session():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "Active"),
        StatusEvent(20_000, "Logout"),
        StatusEvent(25_000, "offline"),
        StatusEvent(40_000, "Login"),
        StatusEvent(50_000, "Logout"),
    ]
    windows = session_windows(events)
    assert assign_session(windows, 5_000) == 1
    assert assign_session(windows, 24_000) == 1
    assert assign_session(windows, 45_000) == 2
    assert assign_session(windows, 100_000) == 2


def test_case_insensitive_login_logout_labels():
    events = [
        StatusEvent(0_000, "LOGIN"),
        StatusEvent(10_000, "Offline"),
        StatusEvent(20_000, "logged out"),
        StatusEvent(30_000, "offline"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 20, metrics
    assert metrics["breakTime"] == 10, metrics


def test_open_session_caps_at_now_instead_of_dropping():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "Active"),
    ]
    metrics = compute_metrics(events, now_ms=40_000)
    assert metrics["loginTime"] == 40, metrics
    assert metrics["breakTime"] == 0, metrics


def test_long_segment_clipped_not_dropped():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "offline"),
        StatusEvent(200_000_000, "Logout"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 10 + 86_400, metrics
    assert metrics["breakTime"] == 86_400, metrics


def test_available_after_offline_starts_session():
    # firstam sample pattern: available(prev=offline) with no explicit login
    events = [
        StatusEvent(0_000, "available", previous_status="offline"),
        StatusEvent(10_000, "busy", previous_status="available"),
        StatusEvent(20_000, "Logout"),
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 20, metrics
    assert metrics["busyTime"] == 10, metrics
    assert metrics["activeTime"] == 10, metrics


def test_available_counts_as_active_not_break():
    events = [
        StatusEvent(0_000, "login"),
        StatusEvent(5_000, "available", previous_status="login"),
        StatusEvent(15_000, "Logout"),
    ]
    # available after login (prev=login) does NOT start a new session
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 15, metrics
    assert metrics["activeTime"] == 15, metrics
    assert metrics["breakTime"] == 0, metrics


def test_firstam_sample_csv_produces_nonzero_login_time():
    fixture = Path(__file__).parent / "fixtures" / "firstam_sample_events.csv"
    assert fixture.exists(), fixture
    with fixture.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    status_rows = [r for r in rows if r["EventName"] == "AGENT_STATUS"]
    assert len(status_rows) >= 1

    events: list[StatusEvent] = []
    for r in sorted(status_rows, key=lambda x: int(x["EventTimeStampEpoch"])):
        events.append(
            StatusEvent(
                ts_ms=int(r["EventTimeStampEpoch"]),
                status=r["EventValue5"] or "",
                previous_status=r["EventValue12"] or "",
            )
        )

    # Cap open sessions near end of sample day (no Logout in sample)
    now_ms = int(datetime(2026, 8, 17, 23, 59, tzinfo=timezone.utc).timestamp() * 1000)
    metrics = compute_metrics(events, now_ms=now_ms)
    assert metrics["loginTime"] > 0, metrics
    assert metrics["activeTime"] > 0 or metrics["busyTime"] > 0, metrics
    # Sample statuses are login/available/busy only — no current offline
    assert set(_norm(e.status) for e in events) <= {"login", "available", "busy"}


def test_early_cutoff_prunes_pre_cutoff_seconds_only():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "offline"),
        StatusEvent(30_000, "Logout"),
    ]
    sns = session_number(events)
    segs = status_segments(events, sns, 1)
    seconds = expand_seconds(segs)
    cutoff_sec = 20
    kept = [(s, st) for s, st in seconds if s >= cutoff_sec]
    assert len({s for s, _ in kept}) == 10
    assert len({s for s, st in kept if _norm(st) == "offline"}) == 10


if __name__ == "__main__":
    test_offline_between_login_and_logout_counts_for_both()
    test_offline_after_logout_excluded_from_login_and_break()
    test_offline_is_not_treated_as_logout()
    test_pre_login_offline_excluded()
    test_two_sessions_clip_independently()
    test_session_window_join_matches_containing_session()
    test_case_insensitive_login_logout_labels()
    test_open_session_caps_at_now_instead_of_dropping()
    test_long_segment_clipped_not_dropped()
    test_available_after_offline_starts_session()
    test_available_counts_as_active_not_break()
    test_firstam_sample_csv_produces_nonzero_login_time()
    test_early_cutoff_prunes_pre_cutoff_seconds_only()
    print("All loginTime/breakTime tests passed.")
