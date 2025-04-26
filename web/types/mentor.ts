export interface Mentor {
  id: string;
  userId: string;
  specialties: string[];
  company?: string;
  jobTitle?: string;
  experience?: number;
  rating: number;
  reviewCount: number;
  availability?: any;
}

export interface MentorProfile {
  id: string;
  mentorId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
  bio: string;
  role: string;
  company: string;
  specialties: string[];
  interest: string;
  rating: number;
  reviews: number;
}

export interface MentorLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface MatchingMentor {
  id: string;
  mentorId: string;
  name: string;
  image: string | null;
  bio: string;
  role: string;
  company: string;
  specialties: string[];
  rating: number;
  reviews: number;
  location: MentorLocation;
  distance: number;
}
