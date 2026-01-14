// Prompts Configuration for Bumble-style profile questions
// Users select 3 prompts and provide their answers

export interface Prompt {
  id: string;
  text: string;
  category: 'fun' | 'practical';
  placeholder: string;
}

export interface PracticalQuestion {
  id: string;
  question: string;
  options: string[];
  forRole: 'OWNER' | 'LOVER' | 'BOTH';
}

// Fun prompts - users pick 3 and write their own answers
export const FUN_PROMPTS: Prompt[] = [
  {
    id: 'ideal_saturday',
    text: 'My ideal Saturday with a pet involves...',
    category: 'fun',
    placeholder: 'e.g., Long walks in the park and cozy cuddles on the couch',
  },
  {
    id: 'heart_way',
    text: 'The way to my heart is through...',
    category: 'fun',
    placeholder: 'e.g., A wagging tail and puppy eyes',
  },
  {
    id: 'hidden_talent',
    text: 'My hidden talent with animals is...',
    category: 'fun',
    placeholder: 'e.g., I can calm even the most nervous pets',
  },
  {
    id: 'if_pet',
    text: 'If I were a pet, I\'d be a...',
    category: 'fun',
    placeholder: 'e.g., Golden Retriever - always happy and social',
  },
  {
    id: 'pet_superpower',
    text: 'My pet\'s superpower is...',
    category: 'fun',
    placeholder: 'e.g., Making everyone smile just by existing',
  },
  {
    id: 'never_without',
    text: 'I never leave home without...',
    category: 'fun',
    placeholder: 'e.g., Treats in my pocket and poop bags',
  },
  {
    id: 'first_pet_memory',
    text: 'My favorite pet memory is...',
    category: 'fun',
    placeholder: 'e.g., When my childhood dog greeted me after school',
  },
  {
    id: 'pet_love_language',
    text: 'My pet love language is...',
    category: 'fun',
    placeholder: 'e.g., Quality time and endless belly rubs',
  },
  {
    id: 'dream_pet',
    text: 'My dream pet adventure would be...',
    category: 'fun',
    placeholder: 'e.g., Beach vacation with my furry best friend',
  },
  {
    id: 'unusual_thing',
    text: 'The most unusual thing I do for pets is...',
    category: 'fun',
    placeholder: 'e.g., Sing them lullabies before bedtime',
  },
];

// Practical questions with predefined options
export const PRACTICAL_QUESTIONS: PracticalQuestion[] = [
  {
    id: 'experience_level',
    question: 'Experience with pets',
    options: ['Beginner', 'Intermediate', 'Expert', 'Professional'],
    forRole: 'BOTH',
  },
  {
    id: 'availability',
    question: 'Availability',
    options: ['Flexible', 'Weekdays only', 'Weekends only', 'Evenings only'],
    forRole: 'LOVER',
  },
  {
    id: 'living_situation',
    question: 'Living situation',
    options: ['Apartment', 'House with yard', 'Farm/Large property', 'Other'],
    forRole: 'BOTH',
  },
  {
    id: 'can_transport',
    question: 'Can transport pets?',
    options: ['Yes', 'No', 'Limited distances'],
    forRole: 'LOVER',
  },
  {
    id: 'pet_types',
    question: 'Comfortable with',
    options: ['Dogs only', 'Cats only', 'Both dogs & cats', 'All animals'],
    forRole: 'LOVER',
  },
  {
    id: 'exercise_level',
    question: 'Exercise commitment',
    options: ['Light walks', 'Moderate activity', 'High energy', 'Varies by pet'],
    forRole: 'LOVER',
  },
];

// Helper functions
export const getPromptsForRole = (role: 'OWNER' | 'LOVER'): Prompt[] => {
  // All fun prompts are available to both roles
  return FUN_PROMPTS;
};

export const getPracticalQuestionsForRole = (role: 'OWNER' | 'LOVER'): PracticalQuestion[] => {
  return PRACTICAL_QUESTIONS.filter(
    (q) => q.forRole === 'BOTH' || q.forRole === role
  );
};

export const MIN_PROMPTS_REQUIRED = 3;
export const MAX_PROMPTS_ALLOWED = 3;
