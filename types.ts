
export type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked' | 'On Hold';
export type Priority = 'High' | 'Medium' | 'Low';
export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export interface HistoryEntry {
  timestamp: string;
  change: string;
}

export interface Comment {
  user: string;
  timestamp: string;
  comment: string;
}

export interface Booking {
  id: string;
  date: string;
  userId: string;
  targetId: string; // Task or Project ID
  targetType: 'task' | 'project';
  hours: number;
  description: string;
}

export interface Task {
  id: string;
  category: string;
  task: string;
  owner: string;
  project: string;
  status: Status;
  priority: Priority;
  progress: number;
  hours: number; // Estimated hours
  startDate: string;
  dueDate: string;
  originalDueDate?: string;
  notes: string;
  okrLink?: string;
  keyResultLink?: string; // Linked specific KR ID
  ideaLink?: string;
  history: HistoryEntry[];
  comments: Comment[];
}

export interface Project {
  id: string;
  name: string;
  manager: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  hours: number; // Estimated hours
  description: string;
  progress?: number; // Manual % completion
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

export interface Idea {
  id: string;
  idea: string;
  proposer: string;
  impact: 'High' | 'Medium' | 'Low';
  cost: 'High' | 'Medium' | 'Low';
  status: 'New' | 'Under Review' | 'Approved' | 'Implemented' | 'Rejected';
  date: string;
}

export interface Kudos {
  id: string;
  from: string;
  to: string;
  reason: string;
  date: string;
}

export interface KeyResult {
  id: string;
  kr: string;
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: KeyResult[];
}

export interface User {
  name: string;
  capacity: number;
}

export type SafetyStatusEntry = { 
  status: 'green' | 'yellow' | 'red'; 
  notes: string;
  safetyDaily?: string;
  resultsAchieved?: string;
  teamSuggestions?: string;
  supportRequired?: string;
  externalDependencies?: string;
};
export type SafetyStatus = Record<string, SafetyStatusEntry>;

export interface AppState {
  version: string;
  tasks: Task[];
  projects: Project[];
  ideas: Idea[];
  kudos: Kudos[];
  okrs: OKR[];
  users: User[];
  bookings: Booking[];
  categories: string[];
  safetyStatus: SafetyStatus;
  dailyAgenda: Record<string, string>;
  lastBackupDate?: string;
  deletedItemIds?: string[]; // Tombstones for robust sync
}
