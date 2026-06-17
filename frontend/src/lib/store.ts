import { create } from 'zustand';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  displayName: string;
  setAuth: (user: User, token: string) => void;
  updateName: (name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  displayName: typeof window !== 'undefined' ? localStorage.getItem('displayName') || '' : '',
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    const saved = localStorage.getItem('displayName') || '';
    set({ user, token, displayName: saved || user.email.split('@')[0] });
  },
  updateName: (name) => {
    localStorage.setItem('displayName', name);
    set({ displayName: name });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, displayName: '' });
  },
}));
