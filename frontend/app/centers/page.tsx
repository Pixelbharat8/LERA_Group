"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";
import { CENTER_IMAGES, HERO_IMAGES } from "../../config/images";

// Types for dynamic centers
interface Center {
  id: string;
  name: string;
  nameVi?: string;
  address: string;
  addressVi?: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  mapUrl?: string;
  workingHours?: string;
  isActive?: boolean;
  order?: number;
}

// Fallback centers data - REAL DATA from LERA Academy
const fallbackCenters: Center[] = [
  {
    id: "1",
    name: "LERA Academy - Vinhomes Marina",
    nameVi: "LERA Academy - Vinhomes Marina",
    address: "95 Hai Dang, Vinhomes Marina, An Bien Ward, Hai Phong",
    addressVi: "95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng",
    phone: "0387.633.141",
    email: "info@lera.edu.vn",
    imageUrl: CENTER_IMAGES["default"],
    workingHours: "8:00 AM - 9:00 PM",
  },
];

export default function CentersPage() {
  const { language, t } = useLanguage();
  const [centers, setCenters] = useState<Center[]>(fallbackCenters);
  const [isLoading, setIsLoading] = useState(true);
  const [contactPhone, setContactPhone] = useState("0387.633.141");

  // Fetch centers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch centers from backend
        const centersData = await publicFetch("/api/centers");
        if (Array.isArray(centersData) && centersData.length > 0) {
          const transformedCenters = centersData
            .filter((c: any) => c.isActive !== false)
            .map((center: any) => ({
              id: center.id,
              name: center.name || center.nameEN,
              nameVi: center.nameVi || center.nameVI || center.name,
              address: center.address || center.addressEN,
              addressVi: center.addressVi || center.addressVI || center.address,
              phone: center.phone || center.phoneNumber,
              email: center.email,
              imageUrl: center.imageUrl || center.image || CENTER_IMAGES["default"],
              mapUrl: center.mapUrl || center.googleMapsUrl,
              workingHours: center.workingHours || "8:00 AM - 9:00 PM",
              order: center.order || center.sortOrder || 0
            }))
            .sort((a: Center, b: Center) => (a.order || 0) - (b.order || 0));

          if (transformedCenters.length > 0) {
            setCenters(transformedCenters);
          }
        }
      } catch (error) {
        console.log("Using fallback centers data");
      }

      try {
        // Fetch contact phone from CMS
        const cmsData = await publicFetch("/api/cms-settings/map/contact");
        if (cmsData && cmsData.contact_phone) {
          setContactPhone(cmsData.contact_phone);
        }
      } catch (error) {
        console.log("Using default contact phone");
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: `url('${HERO_IMAGES.centers}')`}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {language === "EN" ? `📍 ${centers.length} Learning Center${centers.length > 1 ? 's' : ''}` : `📍 ${centers.length} Cơ sở học tập`}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">{t("centersHeroTitle")}</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">{t("centersHeroDesc")}</p>
        </div>
      </section>

      {/* Centers Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-8 ${centers.length === 1 ? 'max-w-2xl mx-auto' : centers.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {centers.map((center) => (
                <div key={center.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src={center.imageUrl} 
                      alt={language === "EN" ? center.name : (center.nameVi || center.name)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white">
                        {language === "EN" ? center.name : (center.nameVi || center.name)}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <p className="text-gray-600 flex items-start gap-2">
                        <span className="text-lg">📍</span>
                        <span>{language === "EN" ? center.address : (center.addressVi || center.address)}</span>
                      </p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="text-lg">📞</span>
                        <a href={`tel:${center.phone.replace(/\s/g, "")}`} className="text-blue-600 hover:underline">
                          {center.phone}
                        </a>
                      </p>
                      {center.email && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="text-lg">✉️</span>
                          <a href={`mailto:${center.email}`} className="text-blue-600 hover:underline">
                            {center.email}
                          </a>
                        </p>
                      )}
                      {center.workingHours && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <span className="text-lg">🕐</span>
                          <span>{center.workingHours}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={`tel:${center.phone.replace(/\s/g, "")}`}
                        className="flex-1 py-3 bg-blue-600 text-white text-center rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                      >
                        {language === "EN" ? "Call Now" : "Gọi ngay"}
                      </a>
                      {center.mapUrl && (
                        <a
                          href={center.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                          🗺️
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            {language === "EN" ? "Can't find a center near you?" : "Không tìm thấy cơ sở gần bạn?"}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {language === "EN" 
              ? "Contact us and we'll help you find the best learning option" 
              : "Liên hệ với chúng tôi và chúng tôi sẽ giúp bạn tìm lựa chọn học tập tốt nhất"}
          </p>
          <a
            href={`tel:${contactPhone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">📞</span>
            {contactPhone}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
