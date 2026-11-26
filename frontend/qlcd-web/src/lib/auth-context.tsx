"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { apiMessage, changePasswordApi, getSessionApi, loginApi, loginErrorMessage, logoutApi, sessionExpiredEvent, verifyLoginAuthenticator, type SessionProfile } from "./api";

export interface UserProfile {
  id: string;
  hoTen: string;
  vaiTro: string;
  role: SessionProfile["vaiTro"];
  phamVi: string;
  donViId?: string;
  donViTen?: string;
  mustChangePassword: boolean;
  needsAuthenticator: boolean;
  recommendPasswordChange: boolean;
}

type LoginResponse = { success: true; challenge?: string } | { success: false; error: string; expired?: boolean };

interface AuthContextType {
  user: UserProfile | null;
  login: (username: string, password: string, activationCode?: string) => Promise<LoginResponse>;
  verifyAuthenticator: (challenge: string, code: string) => Promise<LoginResponse>;
  enrollmentCodes: string[] | null;
  completeEnrollment: (codes: string[]) => Promise<boolean>;
  dismissEnrollmentCodes: () => void;
  refreshSession: () => Promise<UserProfile | null>;
  logout: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string, code: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const labels = { ADMIN: "Administrator", CDCS: "Chủ tịch CĐCS", CDBP: "Chủ tịch CĐBP", TOCD: "Tổ trưởng" };

function profile(data: SessionProfile): UserProfile {
  return {
    id: data.id, hoTen: data.hoTen, vaiTro: labels[data.vaiTro], role: data.vaiTro,
    phamVi: data.vaiTro === "ADMIN" ? "CDCS" : data.vaiTro,
    donViId: data.organizationId ?? undefined, donViTen: data.donViTen ?? undefined,
    mustChangePassword: data.mustChangePassword,
    needsAuthenticator: data.needsAuthenticator,
    recommendPasswordChange: data.recommendPasswordChange,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [enrollmentCodes, setEnrollmentCodes] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    // Remove data written by the retired browser-token implementation.
    localStorage.removeItem("qlcd_user");
    localStorage.removeItem("qlcd_token");
    const onExpired = () => { setUser(null); setEnrollmentCodes(null); };
    window.addEventListener(sessionExpiredEvent, onExpired);
    getSessionApi().then(data => { if (active) setUser(profile(data)); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setIsLoaded(true); });
    return () => {
      active = false;
      window.removeEventListener(sessionExpiredEvent, onExpired);
    };
  }, []);

  async function login(username: string, password: string, activationCode?: string): Promise<LoginResponse> {
    try {
      const result = await loginApi(username, password, activationCode);
      if ("challenge" in result) return { success: true, challenge: result.challenge };
      setUser(profile(result));
      return { success: true };
    } catch (error) {
      return { success: false, error: loginErrorMessage(error, "Đăng nhập thất bại.") };
    }
  }

  async function refreshSession() {
    try {
      const current = profile(await getSessionApi());
      setUser(current);
      return current;
    } catch {
      setUser(null);
      setEnrollmentCodes(null);
      return null;
    }
  }

  async function completeEnrollment(codes: string[]) {
    try {
      const current = profile(await getSessionApi());
      if (current.mustChangePassword || current.needsAuthenticator) return false;
      setEnrollmentCodes(codes);
      setUser(current);
      return true;
    } catch {
      return false;
    }
  }

  async function verifyAuthenticator(challenge: string, code: string): Promise<LoginResponse> {
    try {
      setUser(profile(await verifyLoginAuthenticator(challenge, code)));
      return { success: true };
    } catch (error) {
      return { success: false, error: loginErrorMessage(error, "Không thể xác thực mã."),
        expired: isAxiosError<{ code?: string }>(error) && error.response?.data.code === "mfa_challenge_expired" };
    }
  }

  async function logout() {
    try {
      await logoutApi();
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 401)
        return false;
    }
    setUser(null);
    setEnrollmentCodes(null);
    return true;
  }

  async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string, code: string) {
    try {
      await changePasswordApi(currentPassword, newPassword, confirmPassword, code);
      setUser(null);
      setEnrollmentCodes(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: apiMessage(error, "Không thể đổi mật khẩu.") };
    }
  }

  if (!isLoaded) return <main role="status" className="grid min-h-dvh place-items-center">Đang kiểm tra phiên làm việc…</main>;

  return <AuthContext.Provider value={{
    user, login, verifyAuthenticator, refreshSession, logout, changePassword, enrollmentCodes, completeEnrollment,
    dismissEnrollmentCodes: () => setEnrollmentCodes(null),
    isAuthenticated: user !== null,
  }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
