"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <Link href="/" className="logo">
          <span className="logo-icon">🍽️</span>
          <span className="logo-text">SmartEats</span>
        </Link>
        <p className="tagline">UIUC Dining Nutrition</p>
      </div>
    </header>
  );
}

