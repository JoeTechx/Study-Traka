export type EventType = "exam" | "class" | "study" | "custom";

export type EventColor =
  | "purple"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "pink"
  | "orange";

export interface ScheduleEvent {
  id: string;
  user_id: string;
  title: string;
  event_type: EventType;
  course_id: string | null;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  color: EventColor;
  confirmed: boolean;
  description: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  // joined
  course?: {
    id: string;
    code: string;
    title: string;
  };
}

export interface CreateScheduleEventInput {
  title: string;
  event_type: EventType;
  course_id: string | null;
  start_time: string;
  end_time: string;
  color: EventColor;
  confirmed?: boolean;
  description?: string | null;
  location?: string | null;
  reminder_minutes_before?: number | null;
}

export type ViewMode = "week" | "month" | "day" | "agenda";
