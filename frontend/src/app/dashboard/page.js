'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Redirect based on role
    if (user.role === 'investor') {
      router.push('/dashboard/investor');
    } else {
      router.push('/dashboard/founder');
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
