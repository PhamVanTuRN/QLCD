"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginApi } from "./api";

export interface UserProfile {
  id: string;
  hoTen: string;
  vaiTro: string;
  phamVi: string;        // CDCS | CDBP | TOCD
  donViId?: string;       // ID của đơn vị quản lý
  donViTen?: string;      // Tên đơn vị
}

interface AuthContextType {
  user: UserProfile | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Khôi phục session từ localStorage
    const saved = localStorage.getItem("qlcd_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        Promise.resolve().then(() => {
          setUser(parsed);
        });
      } catch { /* ignore */ }
    }
    Promise.resolve().then(() => {
      setIsLoaded(true);
    });
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const data = await loginApi({ username, password });
      if (data && data.token) {
        localStorage.setItem("qlcd_token", data.token);
        
        let mappedVaiTro = data.vaiTro;
        let mappedPhamVi = "CDCS";
        if (data.vaiTro === "ADMIN") {
          mappedVaiTro = "Administrator";
          mappedPhamVi = "CDCS";
        } else if (data.vaiTro === "CDCS") {
          mappedVaiTro = "Chủ tịch CĐCS";
          mappedPhamVi = "CDCS";
        } else if (data.vaiTro === "CDBP") {
          mappedVaiTro = "Chủ tịch CĐBP";
          mappedPhamVi = "CDBP";
        } else if (data.vaiTro === "TOCD") {
          mappedVaiTro = "Tổ trưởng";
          mappedPhamVi = "TOCD";
        } else if (data.vaiTro === "DOANVIEN") {
          mappedVaiTro = "Đoàn viên";
          mappedPhamVi = "TOCD";
        }

        const profile: UserProfile = {
          id: data.username,
          hoTen: data.hoTen,
          vaiTro: mappedVaiTro,
          phamVi: mappedPhamVi,
          donViId: data.organizationId || undefined,
          donViTen: data.donViTen || undefined
        };
        
        setUser(profile);
        localStorage.setItem("qlcd_user", JSON.stringify(profile));
        return { success: true };
      }
      return { success: false, error: "Đăng nhập thất bại" };
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      const msg = apiError.response?.data?.message || apiError.message || "Tên đăng nhập hoặc mật khẩu không chính xác";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("qlcd_user");
    localStorage.removeItem("qlcd_token");
  };

  if (!isLoaded) {
    return null; // Prevent flash
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
