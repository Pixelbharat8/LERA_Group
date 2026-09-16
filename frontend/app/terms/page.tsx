"use client";

import { useState, useEffect } from "react";
import { LegalSection, TERMS_SECTIONS_EN, TERMS_SECTIONS_VI } from "../../lib/legal-content";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";

// Default content


export default function TermsPage() {
  const { language } = useLanguage();
  const [sectionsEN, setSectionsEN] = useState<LegalSection[]>(TERMS_SECTIONS_EN);
  const [sectionsVI, setSectionsVI] = useState<LegalSection[]>(TERMS_SECTIONS_VI);
  const [title, setTitle] = useState({ EN: "Terms of Service", VI: "Điều Khoản Sử Dụng" });
  const [lastUpdated, setLastUpdated] = useState({ EN: "Last updated: December 2025", VI: "Cập nhật lần cuối: Tháng 12, 2025" });
  const [intro, setIntro] = useState({ 
    EN: "Please read these Terms of Service carefully before using LERA Academy's services.",
    VI: "Vui lòng đọc kỹ Điều khoản Sử dụng trước khi sử dụng dịch vụ của LERA Academy."
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await publicFetch("/api/cms-settings/map/terms").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        if (data.terms_title_en) setTitle(prev => ({ ...prev, EN: data.terms_title_en }));
        if (data.terms_title_vi) setTitle(prev => ({ ...prev, VI: data.terms_title_vi }));
        if (data.terms_last_updated_en) setLastUpdated(prev => ({ ...prev, EN: data.terms_last_updated_en }));
        if (data.terms_last_updated_vi) setLastUpdated(prev => ({ ...prev, VI: data.terms_last_updated_vi }));
        if (data.terms_intro_en) setIntro(prev => ({ ...prev, EN: data.terms_intro_en }));
        if (data.terms_intro_vi) setIntro(prev => ({ ...prev, VI: data.terms_intro_vi }));
        
        // Parse sections if available
        if (data.terms_sections_en) {
          try {
            const loadedSectionsEN = JSON.parse(data.terms_sections_en);
            if (Array.isArray(loadedSectionsEN) && loadedSectionsEN.length > 0) {
              setSectionsEN(loadedSectionsEN);
            }
          } catch (e) {
            console.log("Using default EN sections");
          }
        }
        
        if (data.terms_sections_vi) {
          try {
            const loadedSectionsVI = JSON.parse(data.terms_sections_vi);
            if (Array.isArray(loadedSectionsVI) && loadedSectionsVI.length > 0) {
              setSectionsVI(loadedSectionsVI);
            }
          } catch (e) {
            console.log("Using default VI sections");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching terms content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sections = language === "EN" ? sectionsEN : sectionsVI;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Content */}
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-12"></div>
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-8">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{title[language]}</h1>
              <p className="text-gray-500 mb-8">{lastUpdated[language]}</p>
              <p className="text-lg text-gray-700 mb-12">{intro[language]}</p>

              <div className="space-y-8">
                {sections.map((section, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                    <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
