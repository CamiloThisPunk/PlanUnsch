
export type EventType = 'Examen' | 'Tarea' | 'Lectura' | 'Proyecto' | 'Otro';

export const eventTypes: EventType[] = ['Examen', 'Tarea', 'Lectura', 'Proyecto', 'Otro'];

export interface AcademicEvent {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: EventType;
}

export type SyllabusFileStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface SyllabusFile {
  id: string;
  name: string;
  file: File;
  status: SyllabusFileStatus;
  error?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  syllabi: SyllabusFile[];
}

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}
