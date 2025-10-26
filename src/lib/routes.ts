/**
 * Centralized Application Routes
 * This file contains all route paths used throughout the application
 * to ensure consistency and avoid hard-coded strings
 */

export const AppRoutesPaths = {
  // Public routes
  home: "/",
  features: "/features",
  pricing: "/pricing",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",

  // Authentication routes
  auth: "/auth",
  signIn: "/auth?mode=signin",
  signUp: "/auth?mode=signup",
  forgotPassword: "/forgot-password",
  verifyPassword: "/verify-password",
  changePassword: "/change-password",

  // Dashboard routes (nested)
  dashboard: {
    root: "/dashboard",
    home: "/dashboard",
    brands: "/dashboard/brands",
    "content-calendar": "/dashboard/content-calendar",
    "creative-studio": "/dashboard/creative-studio",
    "quick-content": "/dashboard/quick-content",
    showcase: "/dashboard/showcase",
    "social-connect": "/dashboard/social-connect",
    "brand-profile": "/dashboard/brand-profile",
  },
  
  // App routes
  settings: "/settings",

  // Billing routes
  billing: {
    success: "/billing/success",
    cancel: "/billing/cancel",
  },

  // Other app routes
  cancel: "/cancel",
  success: "/success",

  // Test/Debug routes
  "test-openai": "/test-openai",
  "debug-database": "/debug-database",
  cbrand: "/cbrand",
  artifacts: "/artifacts",
  credits: "/credits",
} as const;

/**
 * Type-safe route access
 */
export type AppRoutePath = typeof AppRoutesPaths;
export type DashboardRoute = keyof typeof AppRoutesPaths.dashboard;