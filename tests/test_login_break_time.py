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


def session_number(events: list[StatusEvent]) -> list[int]:
    n = 0
    out: list[int] = []
    for e in events:
        if e.status in ("Login", "online"):
            n += 1
        out.append(n)
    return out


def logout_epoch(events: list[StatusEvent], session_nums: list[int], session: int) -> int | None:
    logout_ts = [
        e.ts_ms
        for e, sn in zip(events, session_nums)
        if sn == session and e.status == "Logout"
    ]
    return min(logout_ts) if logout_ts else None


def status_segments(
    events: list[StatusEvent], session_nums: list[int], session: int
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
        if end == 0:
            continue
        clipped.append((start, end, status))
    return clipped


def expand_seconds(segments: list[tuple[int, int, str]]) -> list[tuple[int, str]]:
    seconds: list[tuple[int, str]] = []
    for start_ms, end_ms, status in segments:
        start_s = start_ms // 1000
        end_s = end_ms // 1000
        if end_s - start_s >= 86400:
            continue
        for s in range(start_s, end_s):
            seconds.append((s, status))
    return seconds


def compute_metrics(events: list[StatusEvent]) -> dict[str, int]:
    sns = session_number(events)
    # Only sessions after first login
    sessions = sorted({sn for sn in sns if sn > 0})
    all_seconds: list[tuple[int, str]] = []
    for sn in sessions:
        segs = status_segments(events, sns, sn)
        all_seconds.extend(expand_seconds(segs))

    login_time = len({s for s, _ in all_seconds})
    break_time = len({s for s, st in all_seconds if st in ("Unavailable", "offline")})
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


def session_windows(events: list[StatusEvent]) -> list[tuple[int, int, int]]:
    """Optimized conversation join shape: one [start, next_start) per login session."""
    sns = session_number(events)
    starts: dict[int, int] = {}
    for e, sn in zip(events, sns):
        if sn <= 0:
            continue
        starts[sn] = min(starts.get(sn, e.ts_ms), e.ts_ms)
    ordered = sorted(starts.items())
    windows: list[tuple[int, int, int]] = []
    for i, (sn, start) in enumerate(ordered):
        next_start = ordered[i + 1][1] if i + 1 < len(ordered) else start + 86_400_000
        windows.append((sn, start, next_start))
    return windows


def assign_session(windows: list[tuple[int, int, int]], ts_ms: int) -> int | None:
    for sn, start, end in windows:
        if start <= ts_ms < end:
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
    assert assign_session(windows, 100_000) is None


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
    assert len({s for s, st in kept if st == "offline"}) == 10


if __name__ == "__main__":
    test_offline_between_login_and_logout_counts_for_both()
    test_offline_after_logout_excluded_from_login_and_break()
    test_offline_is_not_treated_as_logout()
    test_pre_login_offline_excluded()
    test_two_sessions_clip_independently()
    test_session_window_join_matches_containing_session()
    test_early_cutoff_prunes_pre_cutoff_seconds_only()
    print("All loginTime/breakTime tests passed.")
