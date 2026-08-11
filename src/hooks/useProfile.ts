import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, PortalRole } from '../types/insurance';

export interface SupabaseProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: PortalRole;
  avatar_url?: string;
  designation?: string;
  branch?: string;
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, avatar_url, designation, branch')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          console.error('Failed to fetch profile', error);
          setProfile(null);
        } else {
          setProfile(data ?? null);
        }

        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { profile, loading };
}

export function toUserProfile(p: SupabaseProfile): UserProfile {
  const designationMap: Record<PortalRole, string> = {
    customer: 'Policyholder',
    advisor: 'Insurance Advisor',
    officer: 'Underwriting Officer',
    admin: 'Administrator',
  };
  return {
    id: p.id,
    name: p.full_name || 'User',
    email: p.email || '',
    phone: p.phone || '',
    role: p.role || 'customer',
    designation: p.designation || designationMap[p.role] || 'User',
    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'User')}&background=1d4ed8&color=fff&size=128`,
    branch: p.branch || '',
  };
}
