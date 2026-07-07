"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterByTitle = filterByTitle;
exports.safeCompare = safeCompare;
exports.createMetadata = createMetadata;
exports.addIndexFields = addIndexFields;
exports.buildTaskItem = buildTaskItem;
exports.buildAppointmentItem = buildAppointmentItem;
const crypto_1 = require("crypto");
const constants_1 = require("./constants");
function filterByTitle(items) {
    return items.filter((item) => {
        const title = item === null || item === void 0 ? void 0 : item.title;
        return typeof title === 'string' && title.trim().length > 0;
    });
}
// Constant-time string comparison — prevents timing-based API key enumeration
function safeCompare(a, b) {
    if (a.length !== b.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(Buffer.from(a), Buffer.from(b));
}
function createMetadata(options) {
    return {
        receivedAt: options.receivedAt,
        itemType: options.itemType,
        schemaVersion: constants_1.CLOUDPBX_SCHEMA_VERSION,
        callerDetails: options.callerDetails,
        itemNumber: options.itemNumber,
        totalItems: options.totalItems,
    };
}
function addIndexFields(item, index, total) {
    item.itemIndex = index + 1;
    item.totalItems = total;
}
function buildTaskItem(task, index, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails) {
    var _a;
    const outputItem = {
        title: task.title,
        assignee: (_a = task.assignee) !== null && _a !== void 0 ? _a : null,
    };
    if (includeIndex) {
        outputItem.taskIndex = index + 1;
        outputItem.totalTasks = filteredTasks.length;
    }
    if (includeMetadata) {
        outputItem._metadata = createMetadata({
            receivedAt,
            itemType: constants_1.ITEM_TYPES.TASK,
            callerDetails,
            itemNumber: index + 1,
            totalItems: filteredTasks.length,
        });
    }
    return outputItem;
}
function buildAppointmentItem(appointment, index, filteredAppointments, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails) {
    var _a, _b;
    const outputItem = {
        type: constants_1.ITEM_TYPES.APPOINTMENT,
        title: appointment.title,
        start: (_a = appointment.start) !== null && _a !== void 0 ? _a : null,
        end: (_b = appointment.end) !== null && _b !== void 0 ? _b : null,
    };
    if (includeIndex) {
        outputItem.itemIndex = index + 1;
        outputItem.totalTasks = filteredTasks.length;
        outputItem.totalAppointments = filteredAppointments.length;
    }
    if (includeMetadata) {
        outputItem._metadata = createMetadata({
            receivedAt,
            itemType: constants_1.ITEM_TYPES.APPOINTMENT,
            callerDetails,
            itemNumber: index + 1,
            totalItems: filteredAppointments.length,
        });
    }
    return outputItem;
}
//# sourceMappingURL=helpers.js.map