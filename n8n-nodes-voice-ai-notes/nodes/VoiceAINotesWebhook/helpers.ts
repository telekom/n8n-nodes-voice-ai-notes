import { timingSafeEqual } from 'crypto';
import { IDataObject } from 'n8n-workflow';
import { CallTask, CallAppointment, OutputMetadata } from './types';
import { CLOUDPBX_SCHEMA_VERSION, ITEM_TYPES } from './constants';

interface MetadataOptions {
	receivedAt: string;
	itemType: 'task' | 'appointment' | 'summary';
	callerDetails: string[];
	itemNumber?: number;
	totalItems: number;
}

export function filterByTitle(items: CallTask[]): CallTask[];
export function filterByTitle(items: CallAppointment[]): CallAppointment[];
export function filterByTitle(items: (CallTask | CallAppointment)[]): (CallTask | CallAppointment)[] {
	return items.filter((item) => {
		const title = item?.title;
		return typeof title === 'string' && title.trim().length > 0;
	});
}

// Constant-time string comparison — prevents timing-based API key enumeration
export function safeCompare(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function createMetadata(options: MetadataOptions): OutputMetadata {
	return {
		receivedAt: options.receivedAt,
		itemType: options.itemType,
		schemaVersion: CLOUDPBX_SCHEMA_VERSION,
		callerDetails: options.callerDetails,
		itemNumber: options.itemNumber,
		totalItems: options.totalItems,
	};
}

export function buildTaskItem(
	task: CallTask,
	index: number,
	filteredTasks: CallTask[],
	includeIndex: boolean,
	includeMetadata: boolean,
	receivedAt: string,
	callerDetails: string[],
): IDataObject {
	const outputItem: IDataObject = {
		title: task.title,
		assignee: task.assignee ?? null,
	};

	if (includeIndex) {
		outputItem.taskIndex = index + 1;
		outputItem.totalTasks = filteredTasks.length;
	}

	if (includeMetadata) {
		outputItem._metadata = createMetadata({
			receivedAt,
			itemType: ITEM_TYPES.TASK,
			callerDetails,
			itemNumber: index + 1,
			totalItems: filteredTasks.length,
		});
	}

	return outputItem;
}

export function buildAppointmentItem(
	appointment: CallAppointment,
	index: number,
	filteredAppointments: CallAppointment[],
	filteredTasks: CallTask[],
	includeIndex: boolean,
	includeMetadata: boolean,
	receivedAt: string,
	callerDetails: string[],
): IDataObject {
	const outputItem: IDataObject = {
		type: ITEM_TYPES.APPOINTMENT,
		title: appointment.title,
		start: appointment.start ?? null,
		end: appointment.end ?? null,
	};

	if (includeIndex) {
		outputItem.itemIndex = index + 1;
		outputItem.totalTasks = filteredTasks.length;
		outputItem.totalAppointments = filteredAppointments.length;
	}

	if (includeMetadata) {
		outputItem._metadata = createMetadata({
			receivedAt,
			itemType: ITEM_TYPES.APPOINTMENT,
			callerDetails,
			itemNumber: index + 1,
			totalItems: filteredAppointments.length,
		});
	}

	return outputItem;
}
