"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

interface UserCenterInfo {
  userId: string | null;
  centerId: string | null;
  centerName: string | null;
  userRole: string | null;
  isCenterManager: boolean;
  isCenterAdmin: boolean;
  shouldFilterByCenter: boolean;
  loading: boolean;
}

export function useUserCenter(): UserCenterInfo {
  const [info, setInfo] = useState<UserCenterInfo>({
    userId: null,
    centerId: null,
    centerName: null,
    userRole: null,
    isCenterManager: false,
    isCenterAdmin: false,
    shouldFilterByCenter: false,
    loading: true,
  });

  useEffect(() => {
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        const role = (parsed.roleName || parsed.role || "").toUpperCase();
        const isCenterManager = role === "CENTER_MANAGER";
        const isCenterAdmin = role === "CENTER_ADMIN";
        
        // These roles should only see their center's data
        const shouldFilterByCenter = (isCenterManager || isCenterAdmin) && !!parsed.centerId;
        
        setInfo({
          userId: parsed.id || null,
          centerId: parsed.centerId || null,
          centerName: parsed.centerName || null,
          userRole: role,
          isCenterManager,
          isCenterAdmin,
          shouldFilterByCenter,
          loading: false,
        });
      } else {
        setInfo(prev => ({ ...prev, loading: false }));
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
      setInfo(prev => ({ ...prev, loading: false }));
    }
  }, []);

  return info;
}

export { buildCenterFilterUrl } from "../../lib/center-filter";
