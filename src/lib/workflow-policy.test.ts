import assert from "node:assert/strict";
import test from "node:test";

import { ReportStatus, Role } from "@prisma/client";

import {
  assertTransition,
  canEditReport,
  WorkflowError,
} from "./workflow-policy";

test("students can submit drafts and resubmit requested revisions", () => {
  assert.doesNotThrow(() =>
    assertTransition(ReportStatus.DRAFT, ReportStatus.SUBMITTED, Role.STUDENT),
  );
  assert.doesNotThrow(() =>
    assertTransition(
      ReportStatus.REVISION_REQUESTED,
      ReportStatus.RESUBMITTED,
      Role.STUDENT,
    ),
  );
});

test("supervisors own review transitions", () => {
  assert.doesNotThrow(() =>
    assertTransition(
      ReportStatus.UNDER_REVIEW,
      ReportStatus.APPROVED,
      Role.SUPERVISOR,
    ),
  );
  assert.throws(
    () =>
      assertTransition(
        ReportStatus.UNDER_REVIEW,
        ReportStatus.APPROVED,
        Role.STUDENT,
      ),
    WorkflowError,
  );
});

test("invalid lifecycle jumps are rejected", () => {
  assert.throws(
    () =>
      assertTransition(ReportStatus.DRAFT, ReportStatus.APPROVED, Role.SUPERVISOR),
    WorkflowError,
  );
});

test("only drafts and revision requests are editable", () => {
  assert.equal(canEditReport(ReportStatus.DRAFT), true);
  assert.equal(canEditReport(ReportStatus.REVISION_REQUESTED), true);
  assert.equal(canEditReport(ReportStatus.SUBMITTED), false);
});
