"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITEM_TYPES = exports.OUTPUT_MODES = exports.DEFAULT_RESPONSE_MESSAGE = exports.HTTP_STATUS_CODE_MAX = exports.HTTP_STATUS_CODE_MIN = exports.CLOUDPBX_SCHEMA_VERSION = void 0;
exports.CLOUDPBX_SCHEMA_VERSION = '0.2.1';
exports.HTTP_STATUS_CODE_MIN = 200;
exports.HTTP_STATUS_CODE_MAX = 299;
exports.DEFAULT_RESPONSE_MESSAGE = 'Voice AI data received and processed successfully';
exports.OUTPUT_MODES = {
    TASKS_ONLY: 'tasksOnly',
    TASKS_AND_APPOINTMENTS: 'tasksAndAppointments',
    FULL_SUMMARY: 'fullSummary',
    TASKS_WITH_CONTEXT: 'tasksWithContext',
};
exports.ITEM_TYPES = {
    TASK: 'task',
    APPOINTMENT: 'appointment',
    SUMMARY: 'summary',
};
//# sourceMappingURL=constants.js.map