"""
Unit tests for Login→Logout loginTime / breakTime rules.

Mirrors the session-clipping logic in agent_utilization.sql:
  - loginTime = seconds in [Login, Logout)
  - Offline between Login and Logout counts toward loginTime and breakTime
  - Offline after Logout counts toward neither
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class StatusEvent:
    ts_ms: int
    status: str


LOGIN_STATUSES = {
    "login",
    "logged in",
    "loggedin",
    "logged_in",
    "online",
}
LOGOUT_STATUSES = {
    "logout",
    "logged out",
    "loggedout",
    "logged_out",
}
BREAK_STATUSES = {"unavailable", "offline"}


def _norm(status: str) -> str:
    return status.strip().lower()


def session_number(events: list[StatusEvent]) -> list[int]:
    n = 0
    out: list[int] = []
    for e in events:
        if _norm(e.status) in LOGIN_STATUSES:
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
    """Return (start_ms, end_ms, status) clipped to [Login, Logout).

    Open last segments (no logout / no next event) end at now_ms when provided.
    """
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
        # Clip very long segments to 24h (mirror SQL least(...))
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
        # SQL clips to 24h upstream; still guard against unbounded expands.
        if end_s - start_s > 86_400:
            end_s = start_s + 86_400
        for s in range(start_s, end_s):
            seconds.append((s, status))
    return seconds


def compute_metrics(
    events: list[StatusEvent], *, now_ms: int | None = None
) -> dict[str, int]:
    sns = session_number(events)
    # Only sessions after first login
    sessions = sorted({sn for sn in sns if sn > 0})
    all_seconds: list[tuple[int, str]] = []
    for sn in sessions:
        segs = status_segments(events, sns, sn, now_ms=now_ms)
        all_seconds.extend(expand_seconds(segs))

    login_time = len({s for s, _ in all_seconds})
    break_time = len({s for s, st in all_seconds if _norm(st) in BREAK_STATUSES})
    return {"loginTime": login_time, "breakTime": break_time}


def test_offline_between_login_and_logout_counts_for_both():
    # Login 0s → Active 10s → Offline 20s → Active 30s → Logout 40s → Offline 50s
    # Login window = [0, 40) = 40s
    # Break (Offline in window) = [20, 30) = 10s
    # Post-logout Offline [50, ...) excluded
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "Active"),
        StatusEvent(20_000, "offline"),
        StatusEvent(30_000, "Active"),
        StatusEvent(40_000, "Logout"),
        StatusEvent(50_000, "offline"),
        StatusEvent(60_000, "offline"),  # still post-logout until next Login
    ]
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 40, metrics
    assert metrics["breakTime"] == 10, metrics


def test_offline_after_logout_excluded_from_login_and_break():
    # Login 0 → Logout 10 → long Offline after
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "Logout"),
        StatusEvent(10_000, "offline"),  # same timestamp edge: start >= logout → excluded
        StatusEvent(20_000, "offline"),
        StatusEvent(100_000, "offline"),
    ]
    # Second event at same ts as logout with status offline: session still 1, start==logout → excluded
    # Actually the offline at 10_000 has start >= logout (10_000) → excluded
    # offline at 20_000 and 100_000 also excluded
    # Login segment [0, 10) = 10s login, 0 break
    metrics = compute_metrics(events)
    assert metrics["loginTime"] == 10, metrics
    assert metrics["breakTime"] == 0, metrics


def test_offline_is_not_treated_as_logout():
    # Previously offline was flagged as logout in SQL comments/flags; it must not end the window.
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
        StatusEvent(30_000, "offline"),  # between sessions — excluded
        StatusEvent(40_000, "Login"),
        StatusEvent(50_000, "Active"),
        StatusEvent(60_000, "Logout"),
        StatusEvent(70_000, "offline"),  # after second logout — excluded
    ]
    metrics = compute_metrics(events)
    # Session1 [0,20)=20s with break [10,20)=10s; Session2 [40,60)=20s break 0
    assert metrics["loginTime"] == 40, metrics
    assert metrics["breakTime"] == 10, metrics


def session_windows(events: list[StatusEvent]) -> list[tuple[int, int, int | None]]:
    """Optimized conversation join shape: one [start, next_start) per login session.

    next_start is None for the latest session — matching the SQL branch where
    next_session_start_epoch = 0 makes the upper-bound check always true.
    """
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
    # Optimized path uses 1 window/session instead of CROSS JOIN on every status event.
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
    assert assign_session(windows, 24_000) == 1  # after logout, before next login
    assert assign_session(windows, 45_000) == 2
    # Latest session stays open (same as SQL next_session_start_epoch = 0)
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
    # Login with no Logout and no later event must still produce seconds.
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "Active"),
    ]
    metrics = compute_metrics(events, now_ms=40_000)
    # [0,10) Active-start + [10,40) Active open = 40s login, 0 break
    assert metrics["loginTime"] == 40, metrics
    assert metrics["breakTime"] == 0, metrics


def test_long_segment_clipped_not_dropped():
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "offline"),
        StatusEvent(200_000_000, "Logout"),  # >24h later
    ]
    metrics = compute_metrics(events)
    # Segment Login [0,10) kept; offline [10, 10+86400000) clipped to 24h
    assert metrics["loginTime"] == 10 + 86_400, metrics
    assert metrics["breakTime"] == 86_400, metrics


def test_early_cutoff_prunes_pre_cutoff_seconds_only():
    # Seconds before cutoff must not count; in-window Offline still counts after cutoff.
    events = [
        StatusEvent(0_000, "Login"),
        StatusEvent(10_000, "offline"),
        StatusEvent(30_000, "Logout"),
    ]
    sns = session_number(events)
    segs = status_segments(events, sns, 1)
    seconds = expand_seconds(segs)
    cutoff_sec = 20  # 20_000 ms
    kept = [(s, st) for s, st in seconds if s >= cutoff_sec]
    assert len({s for s, _ in kept}) == 10  # [20, 30)
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
    test_early_cutoff_prunes_pre_cutoff_seconds_only()
    print("All loginTime/breakTime tests passed.")
