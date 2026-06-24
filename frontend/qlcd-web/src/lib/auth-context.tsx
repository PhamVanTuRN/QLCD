"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginApi } from "./api";

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "Data.ViewAll", "Data.ViewOwnOrganization", "Data.ViewSelf",
    "Dashboard.ViewAll", "Reports.ViewAll", "Reports.ExportAll",
    "Members.ViewAll", "Members.ViewOwnOrganization", "Members.Create", "Members.Update",
    "UnionActivities.ViewAll", "UnionActivities.ViewOwnOrganization",
    "Finance.ViewAll", "Finance.ViewOwnOrganization",
    "Quality.ViewAll", "Quality.ManageEvaluation",
    "Dictionaries.View", "Dictionaries.Manage",
    "System.Manage", "Users.Manage", "Roles.Manage"
  ],
  CDCS: [
    "Data.ViewAll",
    "Dashboard.ViewAll",
    "Reports.ViewAll",
    "Reports.ExportAll",
    "Members.ViewAll",
    "UnionActivities.ViewAll",
    "Finance.ViewAll",
    "Quality.ViewAll",
    "Quality.ManageEvaluation",
    "Dictionaries.View"
  ],
  CDBP: [
    "Data.ViewOwnOrganization",
    "Members.ViewOwnOrganization",
    "UnionActivities.ViewOwnOrganization",
    "Finance.ViewOwnOrganization",
    "Dictionaries.View"
  ],
  TOCD: [
    "Data.ViewOwnOrganization",
    "Members.ViewOwnOrganization",
    "Dictionaries.View"
  ],
  DOANVIEN: [
    "Data.ViewSelf"
  ]
};

export interface UserProfile {
  id: string;
  hoTen: string;
  vaiTro: string;        // Mapped display name
  rawVaiTro: string;     // Raw: ADMIN, CDCS, CDBP, etc.
  phamVi: string;        // CDCS | CDBP | TOCD
  donViId?: string;       // ID của đơn vị quản lý
  donViTen?: string;      // Tên đơn vị
  permissions: string[];  // User permissions list
}

interface AuthContextType {
  user: UserProfile | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
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

        const rawVaiTroUpper = (data.vaiTro || "").toUpperCase();
        const permissions = ROLE_PERMISSIONS[rawVaiTroUpper] || [];

        const profile: UserProfile = {
          id: data.username,
          hoTen: data.hoTen,
          vaiTro: mappedVaiTro,
          rawVaiTro: rawVaiTroUpper,
          phamVi: mappedPhamVi,
          donViId: data.organizationId || undefined,
          donViTen: data.donViTen || undefined,
          permissions
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

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };

  if (!isLoaded) {
    return null; // Prevent flash
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasPermission }}>
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
