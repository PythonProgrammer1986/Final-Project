
export type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked' | 'On Hold';
export type Priority = 'High' | 'Medium' | 'Low';
export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export interface Task {
  id: string;
  category: string;
  task: string;
  owner: string;
  project: string;
  status: Status;
  priority: Priority;
  progress: number;
  hours: number;
  startDate: string;
  dueDate: string;
  completionDate?: string;
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  manager: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  hours: number;
  description: string;
}

export interface Activity {
  id: string;
  date: string;
  person: string;
  activity: string;
  hours: number;
  status: 'Completed' | 'In Progress' | 'Blocked';
  remarks: string;
}

export interface KPI {
  id: string;
  name: string;
  target: string;
  completion: number;
  remarks: string;
}

export interface SafetyStatus {
  [date: string]: {
    status: 'green' | 'yellow' | 'red';
    notes: string;
  };
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  activities: Activity[];
  kpis: KPI[];
  users: string[];
  categories: string[];
  safetyStatus: SafetyStatus;
  dailyAgenda: Record<string, string>;
}
