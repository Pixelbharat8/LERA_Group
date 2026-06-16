"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../../lib/api";

interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  departureTime: string;
  arrivalTime: string;
  driver: string;
  vehicle: string;
  capacity: number;
  enrolled: number;
  status: "active" | "inactive";
}

interface TransportRegistration {
  id: string;
  routeName: string;
  pickupPoint: string;
  dropoffPoint: string;
  status: "active" | "pending" | "cancelled";
  monthlyFee: number;
}

export default function TransportPage() {
  const { language } = useLanguage();
  const isVietnamese = language === "VI";
  const [routes, setRoutes] = useState<Route[]>([]);
  const [myRegistration, setMyRegistration] = useState<TransportRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    title: isVietnamese ? "Dịch vụ Đưa đón" : "Transport Service",
    myTransport: isVietnamese ? "Đăng ký của tôi" : "My Registration",
    availableRoutes: isVietnamese ? "Tuyến đường có sẵn" : "Available Routes",
    route: isVietnamese ? "Tuyến" : "Route",
    pickup: isVietnamese ? "Điểm đón" : "Pickup",
    dropoff: isVietnamese ? "Điểm trả" : "Dropoff",
    departure: isVietnamese ? "Khởi hành" : "Departure",
    arrival: isVietnamese ? "Đến nơi" : "Arrival",
    driver: isVietnamese ? "Tài xế" : "Driver",
    vehicle: isVietnamese ? "Phương tiện" : "Vehicle",
    capacity: isVietnamese ? "Sức chứa" : "Capacity",
    enrolled: isVietnamese ? "Đã đăng ký" : "Enrolled",
    monthlyFee: isVietnamese ? "Phí hàng tháng" : "Monthly Fee",
    register: isVietnamese ? "Đăng ký" : "Register",
    cancel: isVietnamese ? "Hủy" : "Cancel",
    active: isVietnamese ? "Đang hoạt động" : "Active",
    pending: isVietnamese ? "Đang chờ" : "Pending",
    noRegistration: isVietnamese ? "Chưa đăng ký dịch vụ đưa đón" : "No transport registration",
    contactInfo: isVietnamese ? "Thông tin liên hệ" : "Contact Information",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [routesData, regData] = await Promise.all([
        apiFetch("/api/transport/routes"),
        apiFetch("/api/transport/my-registration"),
      ]);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setMyRegistration(regData);
    } catch (error) {
      // Don't fabricate routes/registration on failure — show the real (empty) state.
      console.error("Failed to load transport data:", error);
      setRoutes([]);
      setMyRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{t.title}</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
      </div>

      {/* My Registration */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.myTransport}</h2>
        {myRegistration ? (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🚐</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{myRegistration.routeName}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${myRegistration.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {myRegistration.status === 'active' ? t.active : t.pending}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">{t.pickup}</p>
                    <p className="font-medium text-gray-900">{myRegistration.pickupPoint}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t.dropoff}</p>
                    <p className="font-medium text-gray-900">{myRegistration.dropoffPoint}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t.monthlyFee}</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(myRegistration.monthlyFee)}</p>
                <button className="mt-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">{t.cancel}</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">🚌</span>
            {t.noRegistration}
          </div>
        )}
      </div>

      {/* Available Routes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.availableRoutes}</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map(route => (
              <div key={route.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{route.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">{t.departure}</p>
                        <p className="font-medium">{route.departureTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t.arrival}</p>
                        <p className="font-medium">{route.arrivalTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t.driver}</p>
                        <p className="font-medium">{route.driver}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t.vehicle}</p>
                        <p className="font-medium">{route.vehicle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">{t.capacity}</p>
                      <p className="font-bold text-lg">{route.enrolled}/{route.capacity}</p>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                        <div 
                          className={`h-full rounded-full ${route.enrolled >= route.capacity ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${(route.enrolled / route.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <button 
                      disabled={route.enrolled >= route.capacity}
                      className={`px-6 py-3 rounded-lg font-medium ${route.enrolled >= route.capacity ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {t.register}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="font-bold text-lg mb-2">{t.contactInfo}</h3>
        <p className="text-blue-100 mb-4">{isVietnamese ? "Liên hệ để biết thêm thông tin về dịch vụ đưa đón" : "Contact us for more information about transport service"}</p>
        <div className="flex gap-4">
          <a href="tel:0387633141" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 flex items-center gap-2">
            📞 0387.633.141
          </a>
          <a href="mailto:transport@lera.edu.vn" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 flex items-center gap-2">
            📧 transport@lera.edu.vn
          </a>
        </div>
      </div>
    </div>
  );
}
