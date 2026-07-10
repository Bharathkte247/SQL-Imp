const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  isReadOnlyQuery,
  withLimit,
  buildConfig,
} = require("../src/db/connector");
const store = require("../src/wfmStore");

describe("connector helpers", () => {
  it("allows read-only SQL shapes", () => {
    assert.equal(isReadOnlyQuery("SELECT 1"), true);
    assert.equal(isReadOnlyQuery("WITH x AS (SELECT 1) SELECT * FROM x"), true);
    assert.equal(isReadOnlyQuery("SHOW TABLES"), true);
    assert.equal(isReadOnlyQuery("DELETE FROM agents"), false);
    assert.equal(isReadOnlyQuery("DROP TABLE agents"), false);
  });

  it("appends LIMIT when missing", () => {
    assert.equal(withLimit("SELECT * FROM volumes", 100), "SELECT * FROM volumes LIMIT 100");
    assert.equal(withLimit("SELECT * FROM volumes LIMIT 5", 100), "SELECT * FROM volumes LIMIT 5");
  });

  it("builds demo config by default", () => {
    const prev = process.env.DB_TYPE;
    process.env.DB_TYPE = "demo";
    const cfg = buildConfig("demo");
    assert.equal(cfg.type, "demo");
    process.env.DB_TYPE = prev;
  });
});

describe("wfm store", () => {
  it("exposes dashboard with twelve module entries plus connections", () => {
    const dash = store.getDashboard();
    assert.equal(dash.brand, "PulseWFM");
    assert.ok(dash.modules.length >= 12);
    assert.ok(dash.kpis.length >= 5);
  });

  it("computes capacity with shrinkage", () => {
    const plan = store.getCapacityPlan();
    assert.ok(plan.totalShrinkagePct > 0);
    assert.ok(plan.days.length > 0);
    assert.ok(plan.days[0].requiredFte > 0);
  });

  it("updates leave request status", () => {
    const pending = store.leaveRequests.find((l) => l.status === "pending");
    assert.ok(pending);
    const updated = store.updateLeaveStatus(pending.id, "approved");
    assert.equal(updated.status, "approved");
    store.updateLeaveStatus(pending.id, "pending");
  });

  it("acknowledges adherence flags", () => {
    const before = store.getAdherence();
    const open = before.flags.find((f) => f.status === "open");
    assert.ok(open);
    const updated = store.setAdherenceStatus(open.id, "acknowledged");
    assert.equal(updated.status, "acknowledged");
    store.setAdherenceStatus(open.id, "open");
  });
});
