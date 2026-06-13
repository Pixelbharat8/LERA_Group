"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../../lib/api";

interface Section {
  title: string;
  content: string;
}

// Default content
const defaultSectionsEN: Section[] = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, such as when you register for courses, contact us, or participate in our programs. This may include:
    • Name and contact information (email, phone number, address)
    • Child's name and age (for children's programs)
    • Payment information
    • Course preferences and learning progress`
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:
    • Provide and improve our educational services
    • Communicate with you about courses and schedules
    • Send progress reports to parents
    • Process payments and maintain records
    • Send promotional materials (with your consent)`
  },
  {
    title: "3. Information Sharing",
    content: `We do not sell or rent your personal information to third parties. We may share your information with:
    • Our teachers and staff for educational purposes
    • Service providers who assist our operations
    • Legal authorities when required by law`
  },
  {
    title: "4. Data Security",
    content: `We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure. This includes encryption, secure servers, and regular security audits.`
  },
  {
    title: "5. Your Rights",
    content: `You have the right to:
    • Access your personal data
    • Request corrections to your data
    • Request deletion of your data
    • Opt-out of marketing communications`
  },
  {
    title: "6. Contact Us",
    content: `If you have questions about this Privacy Policy, please contact us at:
    Email: privacy@lera.edu.vn
    Phone: 0387.633.141
    Address: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng`
  },
];

const defaultSectionsVI: Section[] = [
  {
    title: "1. Thông Tin Chúng Tôi Thu Thập",
    content: `Chúng tôi thu thập thông tin bạn cung cấp trực tiếp cho chúng tôi, chẳng hạn như khi đăng ký khóa học, liên hệ với chúng tôi hoặc tham gia các chương trình. Điều này có thể bao gồm:
    • Tên và thông tin liên hệ (email, số điện thoại, địa chỉ)
    • Tên và tuổi của trẻ (cho các chương trình trẻ em)
    • Thông tin thanh toán
    • Sở thích khóa học và tiến độ học tập`
  },
  {
    title: "2. Cách Chúng Tôi Sử Dụng Thông Tin",
    content: `Chúng tôi sử dụng thông tin thu thập được để:
    • Cung cấp và cải thiện dịch vụ giáo dục
    • Liên lạc với bạn về các khóa học và lịch trình
    • Gửi báo cáo tiến độ cho phụ huynh
    • Xử lý thanh toán và lưu giữ hồ sơ
    • Gửi tài liệu quảng cáo (với sự đồng ý của bạn)`
  },
  {
    title: "3. Chia Sẻ Thông Tin",
    content: `Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi có thể chia sẻ thông tin với:
    • Giáo viên và nhân viên cho mục đích giáo dục
    • Nhà cung cấp dịch vụ hỗ trợ hoạt động
    • Cơ quan pháp luật khi được yêu cầu`
  },
  {
    title: "4. Bảo Mật Dữ Liệu",
    content: `Chúng tôi thực hiện các biện pháp bảo mật phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập, thay đổi hoặc tiết lộ trái phép. Điều này bao gồm mã hóa, máy chủ an toàn và kiểm tra bảo mật thường xuyên.`
  },
  {
    title: "5. Quyền Của Bạn",
    content: `Bạn có quyền:
    • Truy cập dữ liệu cá nhân của bạn
    • Yêu cầu sửa đổi dữ liệu
    • Yêu cầu xóa dữ liệu
    • Từ chối nhận thông tin tiếp thị`
  },
  {
    title: "6. Liên Hệ",
    content: `Nếu bạn có câu hỏi về Chính Sách Bảo Mật này, vui lòng liên hệ:
    Email: privacy@lera.edu.vn
    Điện thoại: 0387.633.141
    Địa chỉ: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng`
  },
];

export default function PrivacyPage() {
  const { language } = useLanguage();
  const [sectionsEN, setSectionsEN] = useState<Section[]>(defaultSectionsEN);
  const [sectionsVI, setSectionsVI] = useState<Section[]>(defaultSectionsVI);
  const [title, setTitle] = useState({ EN: "Privacy Policy", VI: "Chính Sách Bảo Mật" });
  const [lastUpdated, setLastUpdated] = useState({ EN: "Last updated: December 2025", VI: "Cập nhật lần cuối: Tháng 12, 2025" });
  const [intro, setIntro] = useState({ 
    EN: "At LERA Academy, we are committed to protecting your privacy and ensuring the security of your personal information.",
    VI: "Tại LERA Academy, chúng tôi cam kết bảo vệ quyền riêng tư và đảm bảo an toàn thông tin cá nhân của bạn."
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/privacy").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        if (data.privacy_title_en) setTitle(prev => ({ ...prev, EN: data.privacy_title_en }));
        if (data.privacy_title_vi) setTitle(prev => ({ ...prev, VI: data.privacy_title_vi }));
        if (data.privacy_last_updated_en) setLastUpdated(prev => ({ ...prev, EN: data.privacy_last_updated_en }));
        if (data.privacy_last_updated_vi) setLastUpdated(prev => ({ ...prev, VI: data.privacy_last_updated_vi }));
        if (data.privacy_intro_en) setIntro(prev => ({ ...prev, EN: data.privacy_intro_en }));
        if (data.privacy_intro_vi) setIntro(prev => ({ ...prev, VI: data.privacy_intro_vi }));
        
        // Parse sections if available
        if (data.privacy_sections_en) {
          try {
            const loadedSectionsEN = JSON.parse(data.privacy_sections_en);
            if (Array.isArray(loadedSectionsEN) && loadedSectionsEN.length > 0) {
              setSectionsEN(loadedSectionsEN);
            }
          } catch (e) {
            console.log("Using default EN sections");
          }
        }
        
        if (data.privacy_sections_vi) {
          try {
            const loadedSectionsVI = JSON.parse(data.privacy_sections_vi);
            if (Array.isArray(loadedSectionsVI) && loadedSectionsVI.length > 0) {
              setSectionsVI(loadedSectionsVI);
            }
          } catch (e) {
            console.log("Using default VI sections");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching privacy content:", error);
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
