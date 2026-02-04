"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

interface HeaderProps {
  onOpenGoals?: () => void;
}

export function Header({ onOpenGoals }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="app-header">
      <div className="header-content">
        <Link href="/" className="logo">
          <span className="logo-icon">🍽️</span>
          <span className="logo-text">SmartEats</span>
        </Link>
        <p className="tagline">UIUC Dining Nutrition</p>
        
        <div className="header-actions">
          {onOpenGoals && (
            <button
              className="header-settings-btn"
              onClick={onOpenGoals}
              aria-label="My Profile"
              title="Edit profile"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>My Profile</span>
            </button>
          )}

          {session ? (
            <button className="header-auth-btn" onClick={() => signOut()}>
              Sign out
            </button>
          ) : (
            <button className="header-auth-btn" onClick={() => signIn("google")}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
