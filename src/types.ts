export type ExpenseCategory = 'fixed' | 'home' | 'credit_card' | 'variable';

export interface Expense {
  id?: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: any;
  updatedAt: any;
}

export interface Income {
  id?: string;
  userId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: any;
  updatedAt: any;
}

export interface PhysicalMetric {
  id?: string;
  userId: string;
  weight: number;
  bodyFat?: number;
  date: string;
  createdAt: any;
  updatedAt: any;
}

export type ExerciseType = 'aerobic' | 'strength';

export interface Exercise {
  id?: string;
  userId: string;
  type: ExerciseType;
  name: string;
  value: number; // kg or km/min
  subValue?: number; // reps or bpm
  date: string;
  createdAt: any;
  updatedAt: any;
}
