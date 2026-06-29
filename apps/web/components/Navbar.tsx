"use client";

import Link from 'next/link';
import { ClayButton } from '../../../packages/ui/components/Button';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 w-full z-50 p-4">
      <div className="max-w-7xl mx-auto bg-clay-card backdrop-blur-md shadow-clay-card rounded-clay-button px-6 py-3 flex justify-between items-center border border-white/50">
        <Link href="/" className="text-xl font-black bg-gradient-to-r from-primary-indigo to-primary-cyan bg-clip-text text-transparent">
          CodeArena
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/problems" className="font-medium text-gray-600 hover:text-primary-indigo px-4 py-2">Problems</Link>
          <Link href="/contests" className="font-medium text-gray-600 hover:text-primary-indigo px-4 py-2">Contests</Link>
          
          {status === 'loading' ? (
            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full"></div>
          ) : session ? (
            <div className="flex items-center gap-4 ml-2 border-l pl-4 border-gray-300">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-sm font-bold text-gray-800 leading-tight">
                  {session.user?.name || session.user?.email || 'Arena Player'}
                </span>
                {session.user?.ratingTier && (
                  <span className="text-xs font-semibold text-primary-indigo">
                    Tier: {session.user.ratingTier}
                  </span>
                )}
              </div>
              <ClayButton variant="secondary" onClick={() => signOut()} className="!px-4 !py-2 text-sm">
                Sign Out
              </ClayButton>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => signIn()} className="font-semibold text-gray-600 hover:text-primary-indigo px-4 py-2">
                Log In
              </button>
              <Link href="/register">
                <ClayButton variant="primary" className="!px-6 !py-2">
                  Sign Up
                </ClayButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}