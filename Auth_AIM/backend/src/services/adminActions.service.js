const { prisma } = require('../config/database');
const { AppError } = require('../utils/response');
const { logAdminAction } = require('./adminAudit.service');

const CRITICAL_ACTIONS = new Set([
  'SUSPEND_USER',
  'SUSPEND_TENANT',
  'FORCE_REVOKE_SESSIONS',
  'RESET_SECURITY_STATE',
  'FORCE_INVALIDATE_CACHE',
  'ROLLBACK_ADMINISTRATION',
  'TRIGGER_SYNC',
  'TRIGGER_DIAGNOSTIC',
  'APPLY_AUTHORIZED_OVERRIDE',
  'UNBLOCK_OPERATION',
]);

const ACTION_LABELS = {
  SUSPEND_USER: 'suspend user',
  SUSPEND_TENANT: 'suspend tenant',
  FORCE_REVOKE_SESSIONS: 'force revoke sessions',
  RESET_SECURITY_STATE: 'reset security state',
  FORCE_INVALIDATE_CACHE: 'invalidate cache',
  ROLLBACK_ADMINISTRATION: 'rollback administrative operation',
  TRIGGER_SYNC: 'trigger synchronization',
  TRIGGER_DIAGNOSTIC: 'trigger diagnostic',
  APPLY_AUTHORIZED_OVERRIDE: 'apply authorized override',
  UNBLOCK_OPERATION: 'unblock operation',
};

function normalizeActionType(actionType) {
  const value = String(actionType || '').trim().toUpperCase();
  return value;
}

function makeTraceId(prefix = 'admin-action') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function requestAction({
  actorId,
  tenantId,
  actionType,
  targetType,
  targetId,
  reason,
  metadata = {},
  dryRun = false,
} = {}) {
  const normalized = normalizeActionType(actionType);

  if (!actorId) {
    throw new AppError('Acteur requis', 400, 'ADMIN_ACTION_ACTOR_REQUIRED');
  }

  if (!normalized) {
    throw new AppError('Type d’action requis', 400, 'ADMIN_ACTION_TYPE_REQUIRED');
  }

  if (CRITICAL_ACTIONS.has(normalized) && (!reason || !String(reason).trim())) {
    throw new AppError('Une raison est obligatoire pour cette action critique', 400, 'ADMIN_ACTION_REASON_REQUIRED');
  }

  const payload = {
    traceId: makeTraceId('admin-action'),
    actorId,
    tenantId: tenantId || null,
    actionType: normalized,
    targetType: targetType || 'UNKNOWN',
    targetId: targetId || null,
    status: 'REQUESTED',
    reason: reason || null,
    metadata: metadata || {},
  };

  const record = await prisma.administrativeAction.create({
    data: {
      traceId: payload.traceId,
      actorId: payload.actorId,
      tenantId: payload.tenantId,
      actionType: payload.actionType,
      targetType: payload.targetType,
      targetId: payload.targetId,
      status: 'REQUESTED',
      reason: payload.reason,
      metadata: payload.metadata,
    },
  });

  await logAdminAction({
    traceId: record.traceId,
    actorId,
    tenantId,
    action: `ADMIN_ACTION_${normalized}`,
    targetType: payload.targetType,
    targetId: payload.targetId,
    result: 'SUCCESS',
    reason: payload.reason,
    before: null,
    after: { actionType: normalized, status: 'REQUESTED', targetType: payload.targetType },
    metadata: { dryRun },
  });

  return {
    id: record.id,
    traceId: record.traceId,
    actorId: record.actorId,
    tenantId: record.tenantId,
    actionType: record.actionType,
    targetType: record.targetType,
    targetId: record.targetId,
    status: record.status,
    reason: record.reason,
    metadata: record.metadata || {},
    requestedAt: record.requestedAt,
    actionLabel: ACTION_LABELS[normalized] || normalized.toLowerCase(),
  };
}

async function listActions({ tenantId, status, actorId, targetType, actionType } = {}) {
  const rows = await prisma.administrativeAction.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(status ? { status } : {}),
      ...(actorId ? { actorId } : {}),
      ...(targetType ? { targetType } : {}),
      ...(actionType ? { actionType } : {}),
    },
    orderBy: { requestedAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    traceId: row.traceId,
    actorId: row.actorId,
    tenantId: row.tenantId,
    actionType: row.actionType,
    targetType: row.targetType,
    targetId: row.targetId,
    status: row.status,
    reason: row.reason,
    metadata: row.metadata || {},
    requestedAt: row.requestedAt,
  }));
}

async function getActionById(id) {
  const action = await prisma.administrativeAction.findUnique({ where: { id } });
  if (!action) {
    throw new AppError('Action administrative introuvable', 404, 'ADMIN_ACTION_NOT_FOUND');
  }
  return action;
}

async function executeAction(id, { actorId, resultStatus = 'COMPLETED', failureReason, metadata } = {}) {
  const action = await getActionById(id);

  const next = await prisma.administrativeAction.update({
    where: { id },
    data: {
      status: resultStatus,
      executedAt: new Date(),
      completedAt: resultStatus === 'COMPLETED' ? new Date() : null,
      failureReason: resultStatus === 'FAILED' ? failureReason || 'ADMIN_ACTION_FAILED' : null,
      metadata: metadata || action.metadata,
      approvedAt: action.approvedAt || new Date(),
      approvedBy: action.approvedBy || actorId,
    },
  });

  await logAdminAction({
    traceId: next.traceId,
    actorId: actorId || next.actorId,
    tenantId: next.tenantId,
    action: `ADMIN_ACTION_${next.actionType}_RESULT`,
    targetType: next.targetType,
    targetId: next.targetId,
    result: resultStatus,
    reason: next.reason,
    before: { status: action.status },
    after: { status: next.status },
    metadata: { failureReason: next.failureReason },
  });

  return {
    id: next.id,
    traceId: next.traceId,
    actionType: next.actionType,
    targetType: next.targetType,
    targetId: next.targetId,
    status: next.status,
    reason: next.reason,
    metadata: next.metadata || {},
  };
}

module.exports = {
  requestAction,
  listActions,
  getActionById,
  executeAction,
};
