import { User } from "@/types";

export const mockUser: User = {
  id: "user-001",
  name: "Sarah Chen",
  email: "sarah.chen@university.edu",
  role: "analyst",
  avatarUrl: undefined,
};

export const mockUsers: User[] = [
  mockUser,
  {
    id: "user-002",
    name: "Michael Roberts",
    email: "m.roberts@university.edu",
    role: "admin",
  },
  {
    id: "user-003",
    name: "Jessica Martinez",
    email: "j.martinez@university.edu",
    role: "viewer",
  },
];
