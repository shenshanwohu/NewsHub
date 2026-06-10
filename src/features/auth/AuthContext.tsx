'use client';

import { createContext, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types/common';
import type { User } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// AuthContextType
// ──────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  canPublish: boolean;
  canManageCategories: boolean;
  canManageSettings: boolean;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | null>(null);

// ──────────────────────────────────────────────
// AuthProvider
// ──────────────────────────────────────────────

interface AuthProviderProps {
  user: User | null;
  profile: Profile | null;
  children: React.ReactNode;
}

export function AuthProvider({
  user: initialUser,
  profile: initialProfile,
  children,
}: AuthProviderProps) {
  const router = useRouter();
  const supabase = createClient();

  // 监听外部认证状态变化（如其他 Tab 登出）
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/admin/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const signOut = useCallback(async () => {
    const { logout } = await import('@/lib/actions/auth');
    await logout();
    router.push('/admin/login');
  }, [router]);

  const isAuthenticated = !!initialUser && !!initialProfile;
  const role = initialProfile?.role;

  const value: AuthContextType = {
    user: initialUser,
    profile: initialProfile,
    isLoading: false,
    isAuthenticated,
    signOut,
    canPublish: role === 'publisher' || role === 'super_admin',
    canManageCategories: role === 'super_admin',
    canManageSettings: role === 'super_admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
