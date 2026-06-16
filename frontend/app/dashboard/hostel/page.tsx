"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../../lib/api";

interface Room {
  id: string;
  roomNumber: string;
  type: "single" | "double" | "quad";
  floor: number;
  capacity: number;
  occupied: number;
  amenities: string[];
  monthlyFee: number;
  available: boolean;
}

interface HostelRegistration {
  id: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  monthlyFee: number;
  status: "active" | "pending" | "expired";
  roommates?: string[];
}

export default function HostelPage() {
  const { language } = useLanguage();
  const isVietnamese = language === "VI";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [myRegistration, setMyRegistration] = useState<HostelRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");

  const t = {
    title: isVietnamese ? "Ký túc xá" : "Hostel",
    myRoom: isVietnamese ? "Phòng của tôi" : "My Room",
    availableRooms: isVietnamese ? "Phòng trống" : "Available Rooms",
    roomNumber: isVietnamese ? "Số phòng" : "Room Number",
    floor: isVietnamese ? "Tầng" : "Floor",
    type: isVietnamese ? "Loại phòng" : "Room Type",
    capacity: isVietnamese ? "Sức chứa" : "Capacity",
    amenities: isVietnamese ? "Tiện nghi" : "Amenities",
    monthlyFee: isVietnamese ? "Phí hàng tháng" : "Monthly Fee",
    checkIn: isVietnamese ? "Ngày vào" : "Check-in",
    book: isVietnamese ? "Đặt phòng" : "Book",
    single: isVietnamese ? "Đơn" : "Single",
    double: isVietnamese ? "Đôi" : "Double",
    quad: isVietnamese ? "4 người" : "Quad",
    all: isVietnamese ? "Tất cả" : "All",
    active: isVietnamese ? "Đang ở" : "Active",
    pending: isVietnamese ? "Đang chờ" : "Pending",
    roommates: isVietnamese ? "Bạn cùng phòng" : "Roommates",
    noRegistration: isVietnamese ? "Chưa đăng ký ký túc xá" : "No hostel registration",
    rules: isVietnamese ? "Nội quy ký túc xá" : "Hostel Rules",
  };

  const roomTypes = { single: t.single, double: t.double, quad: t.quad };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsData, regData] = await Promise.all([
        apiFetch("/api/hostel/rooms"),
        apiFetch("/api/hostel/my-registration"),
      ]);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setMyRegistration(regData);
    } catch (error) {
      // Don't fabricate rooms/registration on failure — show the real (empty) state.
      console.error("Failed to load hostel data:", error);
      setRooms([]);
      setMyRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredRooms = selectedType === "all" ? rooms : rooms.filter(r => r.type === selectedType);

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

      {/* My Room */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.myRoom}</h2>
        {myRegistration ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">🏠</div>
                  <div>
                    <h3 className="font-bold text-2xl text-gray-900">{t.roomNumber} {myRegistration.roomNumber}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${myRegistration.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {myRegistration.status === 'active' ? t.active : t.pending}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t.type}</p>
                    <p className="font-medium text-gray-900">{roomTypes[myRegistration.roomType as keyof typeof roomTypes]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.checkIn}</p>
                    <p className="font-medium text-gray-900">{new Date(myRegistration.checkInDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {myRegistration.roommates && myRegistration.roommates.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">{t.roommates}</p>
                    <div className="flex gap-2 mt-1">
                      {myRegistration.roommates.map((mate, i) => (
                        <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">{mate}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t.monthlyFee}</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(myRegistration.monthlyFee)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">🏨</span>
            {t.noRegistration}
          </div>
        )}
      </div>

      {/* Available Rooms */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t.availableRooms}</h2>
          <div className="flex gap-2">
            {["all", "single", "double", "quad"].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium ${selectedType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {type === "all" ? t.all : roomTypes[type as keyof typeof roomTypes]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map(room => (
              <div key={room.id} className={`border rounded-xl p-5 ${room.available ? 'border-gray-200 hover:shadow-md' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{t.roomNumber} {room.roomNumber}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {room.available ? (isVietnamese ? "Còn trống" : "Available") : (isVietnamese ? "Đã đầy" : "Full")}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.type}</span>
                    <span className="font-medium">{roomTypes[room.type]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.floor}</span>
                    <span className="font-medium">{room.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.capacity}</span>
                    <span className="font-medium">{room.occupied}/{room.capacity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.amenities}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.amenities.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-lg text-blue-600">{formatCurrency(room.monthlyFee)}</span>
                  <button 
                    disabled={!room.available}
                    className={`px-4 py-2 rounded-lg font-medium ${room.available ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  >
                    {t.book}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hostel Rules */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.rules}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "🚪", rule: isVietnamese ? "Giờ giới nghiêm: 22:00" : "Curfew: 10:00 PM" },
            { icon: "🚭", rule: isVietnamese ? "Cấm hút thuốc trong phòng" : "No smoking in rooms" },
            { icon: "🔇", rule: isVietnamese ? "Giữ yên lặng sau 22:00" : "Keep quiet after 10:00 PM" },
            { icon: "👥", rule: isVietnamese ? "Không đưa người lạ vào phòng" : "No visitors in rooms" },
            { icon: "🧹", rule: isVietnamese ? "Giữ phòng sạch sẽ" : "Keep room clean" },
            { icon: "⚡", rule: isVietnamese ? "Tiết kiệm điện nước" : "Save electricity and water" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-gray-700">{item.rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
