import axios from 'axios';
import { UserType, UserProfile, Language, Jurisdiction } from '../types';

const API_BASE = '/api';

/**
 * LEGALLENS HYBRID AUTH SERVICE
 * Combines Backend OTP Verification with Local Vault Persistence.
 */

export const authService = {
  // Initiates registration on backend
  registerRequest: async (name: string, email: string, userType: UserType, password: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE}/register`, {
        email,
        password,
        role: userType,
        name
      });
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Registration request failed.");
    }
  },

  // Initiates login on backend
  loginRequest: async (email: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE}/login`, {
        email
      });
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Login request failed.");
    }
  },

  // Final verification step
  verifyOtp: async (email: string, otp: string, userType: UserType): Promise<UserProfile> => {
    try {
      const response = await axios.post(`${API_BASE}/verify-otp`, {
        email,
        otp
      });

      const { token, id, name, role } = response.data;
      
      const profile: UserProfile = {
        id: id,
        identifier: email,
        token: token,
        name: name,
        userType: role as UserType,
        preferences: {
          language: Language.ENGLISH,
          jurisdiction: Jurisdiction.UNION
        }
      };

      // Persist to local vault
      localStorage.setItem(`legallens_identity_${email}`, JSON.stringify(profile));
      
      return profile;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Invalid or expired security code.");
    }
  }
};

// Legacy exports
export const registerUser = authService.registerRequest;
export const loginUser = authService.loginRequest;
export const verifyOTP = authService.verifyOtp;
