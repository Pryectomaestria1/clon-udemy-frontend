export interface Resource {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  resources?: Resource[];
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons?: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  price: number;
  description?: string;
  coverImage?: string;
  instructorId?: string;
  instructor?: { name?: string };
  modules?: Module[];
  [key: string]: unknown;
}

export interface Enrollment {
  courseId: string;
  enrollmentId?: string;
  title?: string;
  coverImage?: string;
  progress?: number;
  completedLessons?: string[];
}
