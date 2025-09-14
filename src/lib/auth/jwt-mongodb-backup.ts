// JWT authentication utilities
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userService } from '../mongodb/database';
import type { UserDocument } from '../mongodb/schemas';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// User payload for JWT
export interface JWTPayload {
  userId: string;
  email: string;
  displayName?: string;
  isAnonymous?: boolean;
}

// Authentication result
export interface AuthResult {
  success: boolean;
  user?: JWTPayload;
  token?: string;
  refreshToken?: string;
  error?: string;
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'nevis-ai',
    audience: 'nevis-ai-users',
  });
}

// Generate refresh token
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'nevis-ai',
    audience: 'nevis-ai-refresh',
  });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'nevis-ai',
      audience: 'nevis-ai-users',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'nevis-ai',
      audience: 'nevis-ai-refresh',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate user ID
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate anonymous user ID
export function generateAnonymousUserId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await userService.findOne({ email });
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate user ID
    const userId = generateUserId();

    // Create user document
    const userData = {
      userId,
      email,
      displayName: displayName || '',
      photoURL: '',
      hashedPassword,
      preferences: {
        theme: 'system' as const,
        notifications: true,
        autoSave: true,
      },
      subscription: {
        plan: 'free' as const,
        status: 'active' as const,
      },
    };

    await userService.create(userData);

    // Generate tokens
    const payload: JWTPayload = {
      userId,
      email,
      displayName,
      isAnonymous: false,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      success: true,
      user: payload,
      token,
      refreshToken,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Registration failed. Please try again.',
    };
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await userService.findOne({ email });
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, (user as any).hashedPassword);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
      isAnonymous: false,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      success: true,
      user: payload,
      token,
      refreshToken,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Login failed. Please try again.',
    };
  }
}

// Create anonymous user
export async function createAnonymousUser(): Promise<AuthResult> {
  try {
    // Generate anonymous user ID
    const userId = generateAnonymousUserId();

    // Create anonymous user document
    const userData = {
      userId,
      email: `${userId}@anonymous.local`,
      displayName: 'Anonymous User',
      photoURL: '',
      preferences: {
        theme: 'system' as const,
        notifications: true,
        autoSave: true,
      },
      subscription: {
        plan: 'free' as const,
        status: 'active' as const,
      },
    };

    await userService.create(userData);

    // Generate tokens
    const payload: JWTPayload = {
      userId,
      email: userData.email,
      displayName: userData.displayName,
      isAnonymous: true,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      success: true,
      user: payload,
      token,
      refreshToken,
    };
  } catch (error) {
    console.error('Anonymous user creation error:', error);
    return {
      success: false,
      error: 'Failed to create anonymous user',
    };
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<AuthResult> {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid refresh token',
      };
    }

    // Verify user still exists
    const user = await userService.findOne({ userId: payload.userId });
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Generate new access token
    const newPayload: JWTPayload = {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
      isAnonymous: payload.isAnonymous,
    };

    const newToken = generateToken(newPayload);

    return {
      success: true,
      user: newPayload,
      token: newToken,
      refreshToken, // Keep the same refresh token
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: 'Failed to refresh token',
    };
  }
}

// Get user from token
export async function getUserFromToken(token: string): Promise<UserDocument | null> {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = await userService.findOne({ userId: payload.userId });
    return user;
  } catch (error) {
    console.error('Get user from token error:', error);
    return null;
  }
}
