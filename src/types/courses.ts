export interface Course {
  id: string;
  user_id: string;
  title: string;
  code: string;
  unit: number;
  lecturer_name: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingListItem {
  id: string;
  user_id: string;
  course_id: string;
  topic: string;
  class_date: string;
  done: boolean;
  starred: boolean;
  border_color: string;
  created_at: string;
  updated_at: string;
  // Joined data
  course?: Course;
}

export interface CreateCourseInput {
  title: string;
  code: string;
  unit: number;
  lecturer_name: string;
}

export interface CreateReadingListInput {
  course_id: string;
  topic: string;
  class_date: string;
}

export type BorderColor =
  | "gray"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange";
