// TODO: Define User interface with role types
// TODO: Define TutorProfile interface
// TODO: Define StudentProfile interface
// TODO: Define Lesson interface
// TODO: Define HourPackage interface
// TODO: Define AvailabilitySlot interface

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'tutor' | 'student'
  // TODO: Add more user properties
}

// TODO: Add other type definitions from the stack document
