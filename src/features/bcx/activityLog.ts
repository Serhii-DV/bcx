import { getErrorMessage } from 'src/utils/getErrorMessage';

export const ACTIVITY_LOG_KEY = '/activity-log/operations';
export const ACTIVITY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const ACTIVITY_PROCESSES = [
  'sync',
  'availability',
  'storage',
  'storage-history',
] as const;
export const ACTIVITY_STATUSES = [
  'running',
  'completed',
  'warning',
  'failed',
  'cancelled',
] as const;
export type ActivityProcess = (typeof ACTIVITY_PROCESSES)[number];
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];
export interface ActivityEvent {
  time: number;
  message: string;
}
export interface ActivityOperation {
  id: string;
  process: ActivityProcess;
  title: string;
  automatic: boolean;
  startedAt: number;
  finishedAt?: number;
  status: ActivityStatus;
  events: ActivityEvent[];
}
export const activityProcessLabels: Record<ActivityProcess, string> = {
  sync: 'Bandcamp sync',
  availability: 'Availability checks',
  storage: 'Storage measurement',
  'storage-history': 'Storage history',
};
export interface ActivityLine extends ActivityEvent {
  id: string;
  level: 'info' | 'warning' | 'error';
}

// Flatten existing records without changing stored data or the writer protocol.
export function activityLines(
  operations: ActivityOperation[],
  showAutomatic: boolean,
): ActivityLine[] {
  const lines: ActivityLine[] = [];
  for (const operation of operations) {
    const routine = operation.automatic && !showAutomatic;
    if (
      routine &&
      operation.status !== 'warning' &&
      operation.status !== 'failed'
    )
      continue;
    if (!routine)
      lines.push({
        id: `${operation.id}-start`,
        time: operation.startedAt,
        message: `${operation.title} started.`,
        level: 'info',
      });
    operation.events.forEach((event, index) => {
      const final =
        operation.status !== 'running' && index === operation.events.length - 1;
      if (routine && !final) return;
      const progress = /^Checking saved pages \d+\/\d+…$/.test(event.message);
      // Progress is temporary; the availability summary replaces it on completion.
      if (
        progress &&
        (operation.status !== 'running' ||
          index !== operation.events.length - 1)
      )
        return;
      const level =
        final && operation.status === 'failed'
          ? 'error'
          : final && operation.status === 'warning'
            ? 'warning'
            : 'info';
      let message = `${activityProcessLabels[operation.process]}: ${event.message}`;
      if (final) {
        const outcome =
          operation.status === 'completed'
            ? 'completed'
            : operation.status === 'warning'
              ? 'finished with warnings'
              : operation.status;
        const seconds =
          Math.max(
            0,
            (operation.finishedAt ?? event.time) - operation.startedAt,
          ) / 1000;
        message = `${activityProcessLabels[operation.process]} ${outcome} in ${seconds.toFixed(1)}s. ${event.message}`;
      }
      lines.push({
        id: `${operation.id}-${progress ? 'progress' : index}`,
        time: event.time,
        message,
        level,
      });
    });
  }
  // Reverse insertion order breaks equal-millisecond ties with the final event first.
  return lines.reverse().sort((a, b) => b.time - a.time);
}
export const ACTIVITY_MAX_OPERATIONS = 200;
export const ACTIVITY_MAX_BYTES = 256 * 1024;
const MAX_EVENTS = 40;
const MAX_MESSAGE = 500;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isTime(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 8.64e15
  );
}
function isOperation(value: unknown): value is ActivityOperation {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    value.id.length <= 100 &&
    ACTIVITY_PROCESSES.some((process) => process === value.process) &&
    typeof value.title === 'string' &&
    value.title.length <= MAX_MESSAGE &&
    typeof value.automatic === 'boolean' &&
    isTime(value.startedAt) &&
    (value.finishedAt === undefined || isTime(value.finishedAt)) &&
    ACTIVITY_STATUSES.some((status) => status === value.status) &&
    Array.isArray(value.events) &&
    value.events.length <= MAX_EVENTS &&
    value.events.every(
      (event) =>
        isObject(event) &&
        isTime(event.time) &&
        typeof event.message === 'string' &&
        event.message.length <= MAX_MESSAGE,
    )
  );
}
function retained(operations: ActivityOperation[]): ActivityOperation[] {
  return operations
    .filter(
      (operation) => operation.startedAt >= Date.now() - ACTIVITY_RETENTION_MS,
    )
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, ACTIVITY_MAX_OPERATIONS);
}
export async function readActivityLog(): Promise<ActivityOperation[]> {
  const value: unknown = (await chrome.storage.local.get(ACTIVITY_LOG_KEY))[
    ACTIVITY_LOG_KEY
  ];
  if (value === undefined) return [];
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !Array.isArray(value.operations) ||
    value.operations.length > ACTIVITY_MAX_OPERATIONS ||
    !value.operations.every(isOperation) ||
    new Set(value.operations.map((operation) => operation.id)).size !==
      value.operations.length
  ) {
    throw new Error(
      'Activity log is invalid or uses an unsupported version. Clear the log to reset it.',
    );
  }
  return retained(value.operations);
}

// Only the background worker mutates the log. Serialize all writes, including clear.
let pending: Promise<void> = Promise.resolve();
function mutate(
  change: (operations: ActivityOperation[]) => ActivityOperation[],
): Promise<void> {
  const write = pending.then(async () => {
    const operations = retained(change(await readActivityLog()));
    const bytes = () =>
      new TextEncoder().encode(JSON.stringify({ version: 1, operations }))
        .length;
    while (operations.length && bytes() > ACTIVITY_MAX_BYTES) operations.pop();
    await chrome.storage.local.set({
      [ACTIVITY_LOG_KEY]: { version: 1, operations },
    });
  });
  pending = write.catch(() => {});
  return write;
}
// Observability failures must not change the outcome of the underlying operation.
async function record(
  change: (operations: ActivityOperation[]) => ActivityOperation[],
): Promise<void> {
  try {
    await mutate(change);
  } catch (error) {
    console.error('Could not save activity log:', error);
  }
}
export function recoverActivityLog(): Promise<void> {
  return record((operations) =>
    operations.map((operation) =>
      operation.status === 'running'
        ? {
            ...operation,
            status: 'warning',
            finishedAt: Date.now(),
            events: [
              ...operation.events,
              {
                time: Date.now(),
                message:
                  'Background worker restarted before completion was recorded. Check the process status before retrying.',
              },
            ].slice(-MAX_EVENTS),
          }
        : operation,
    ),
  );
}
export async function startActivity(
  process: ActivityProcess,
  title: string,
  automatic = false,
  id: string = crypto.randomUUID(),
): Promise<string> {
  await record((operations) => [
    {
      id,
      process,
      title: title.slice(0, MAX_MESSAGE),
      automatic,
      startedAt: Date.now(),
      status: 'running',
      events: [],
    },
    ...operations,
  ]);
  return id;
}
export function updateActivity(
  id: string,
  message: string,
  status?: ActivityStatus,
  replaceProgress = false,
): Promise<void> {
  return record((operations) =>
    operations.map((operation) => {
      if (operation.id !== id) return operation;
      const events = [...operation.events];
      if (
        replaceProgress &&
        events.at(-1)?.message.startsWith('Checking saved pages ')
      )
        events.pop();
      events.push({ time: Date.now(), message: message.slice(0, MAX_MESSAGE) });
      return {
        ...operation,
        events: events.slice(-MAX_EVENTS),
        status: status ?? operation.status,
        ...(status && status !== 'running' ? { finishedAt: Date.now() } : {}),
      };
    }),
  );
}
export function clearActivityLog(): Promise<void> {
  const clear = pending.then(() =>
    chrome.storage.local.remove(ACTIVITY_LOG_KEY),
  );
  pending = clear.catch(() => {});
  return clear;
}
export function activityError(error: unknown): string {
  return getErrorMessage(error, 'Unexpected process error.');
}
