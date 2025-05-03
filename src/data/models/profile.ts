export interface Profile {
  id: string;
  name: string;
  lastName: string;
  linkedInUrl: string;
  linkedInData?: {
    headline?: string;
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
    }>;
    education?: Array<{
      school: string;
      degree: string;
      field: string;
    }>;
    skills?: string[];
  };
} 