export const CLOUDPBX_SCHEMA_VERSION = '0.2.1';

export const HTTP_STATUS_CODE_MIN = 200;
export const HTTP_STATUS_CODE_MAX = 299;

export const DEFAULT_RESPONSE_MESSAGE = 'Voice AI data received and processed successfully';

export const OUTPUT_MODES = {
	TASKS_ONLY: 'tasksOnly',
	TASKS_AND_APPOINTMENTS: 'tasksAndAppointments',
	FULL_SUMMARY: 'fullSummary',
	TASKS_WITH_CONTEXT: 'tasksWithContext',
} as const;

export const ITEM_TYPES = {
	TASK: 'task',
	APPOINTMENT: 'appointment',
	SUMMARY: 'summary',
} as const;
