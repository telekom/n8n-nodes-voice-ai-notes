import { IDataObject } from 'n8n-workflow';
import { CallTask, CallAppointment, OutputMetadata } from './types';
interface MetadataOptions {
    receivedAt: string;
    itemType: 'task' | 'appointment' | 'summary';
    callerDetails: string[];
    itemNumber?: number;
    totalItems: number;
}
export declare function filterByTitle(items: CallTask[]): CallTask[];
export declare function filterByTitle(items: CallAppointment[]): CallAppointment[];
export declare function safeCompare(a: string, b: string): boolean;
export declare function createMetadata(options: MetadataOptions): OutputMetadata;
export declare function addIndexFields(item: IDataObject, index: number, total: number): void;
export declare function buildTaskItem(task: CallTask, index: number, filteredTasks: CallTask[], includeIndex: boolean, includeMetadata: boolean, receivedAt: string, callerDetails: string[]): IDataObject;
export declare function buildAppointmentItem(appointment: CallAppointment, index: number, filteredAppointments: CallAppointment[], filteredTasks: CallTask[], includeIndex: boolean, includeMetadata: boolean, receivedAt: string, callerDetails: string[]): IDataObject;
export {};
//# sourceMappingURL=helpers.d.ts.map