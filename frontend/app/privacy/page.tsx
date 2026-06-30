"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";

interface Section {
  title: string;
  content: string;
}

// Default content
const defaultSectionsEN: Section[] = [
  {
    title: "1. Scope & Legal Basis",
    content: `LERA Academy processes personal data in accordance with Vietnam's Personal Data Protection Decree (Nghị định 13/2023/NĐ-CP). We process your data on the basis of your consent and to perform our educational services. By submitting a form on this website you consent to the processing described here.`
  },
  {
    title: "2. Information We Collect",
    content: `We collect information you provide directly, such as when you enrol, book a trial, contact us, or use our services. This may include:
    • Name and contact information (email, phone number, address)
    • A child's name and age (for children's programs)
    • Payment information
    • Course preferences and learning progress`
  },
  {
    title: "3. Children's Data & Parental Consent",
    content: `Many of our learners are minors. Where we process a child's personal data, we do so only with the consent of the child's parent or legal guardian, who provides that consent when submitting our forms. A parent/guardian may review, correct, or request deletion of their child's data at any time.`
  },
  {
    title: "4. How We Use Your Information",
    content: `We use the information we collect to:
    • Provide and improve our educational services
    • Communicate with you about courses and schedules
    • Send progress reports to parents
    • Process payments and maintain records
    • Send promotional materials (only with your consent)`
  },
  {
    title: "5. Information Sharing",
    content: `We do not sell or rent your personal data. We may share it with:
    • Our teachers and staff for educational purposes
    • Service providers who assist our operations (e.g. our licensed payment gateway)
    • Legal authorities when required by law`
  },
  {
    title: "6. Data Storage, Security & Retention",
    content: `Your data is stored on servers located in Vietnam and protected with appropriate technical and organisational measures (encryption, access controls). We retain your data for as long as you use our services and for any period required by law, after which it is securely deleted. We will notify affected individuals and the competent authority of a personal-data breach as required by law.`
  },
  {
    title: "7. Your Rights",
    content: `Under Nghị định 13/2023/NĐ-CP you have the right to:
    • Be informed about how your data is processed
    • Give and withdraw consent at any time
    • Access, correct, or request deletion of your data
    • Restrict or object to processing
    • Lodge a complaint with the competent authority`
  },
  {
    title: "8. Contact Us",
    content: `For any privacy request (access, correction, deletion, or withdrawing consent), contact us at:
    Email: privacy@leraacademy.edu.vn
    Phone: 0387.633.141
    Address: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng`
  },
];

const defaultSectionsVI: Section[] = [
  {
    title: "1. Phạm Vi & Cơ Sở Pháp Lý",
    content: `LERA Academy xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Chúng tôi xử lý dữ liệu của bạn trên cơ sở sự đồng ý của bạn và để cung cấp dịch vụ giáo dục. Khi gửi biểu mẫu trên website này, bạn đồng ý với việc xử lý dữ liệu được mô tả tại đây.`
  },
  {
    title: "2. Thông Tin Chúng Tôi Thu Thập",
    content: `Chúng tôi thu thập thông tin bạn cung cấp trực tiếp, chẳng hạn khi đăng ký nhập học, đăng ký học thử, liên hệ hoặc sử dụng dịch vụ. Có thể bao gồm:
    • Tên và thông tin liên hệ (email, số điện thoại, địa chỉ)
    • Tên và tuổi của trẻ (cho các chương trình trẻ em)
    • Thông tin thanh toán
    • Sở thích khóa học và tiến độ học tập`
  },
  {
    title: "3. Dữ Liệu Của Trẻ Em & Sự Đồng Ý Của Phụ Huynh",
    content: `Nhiều học viên của chúng tôi là trẻ vị thành niên. Khi xử lý dữ liệu cá nhân của trẻ, chúng tôi chỉ thực hiện khi có sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp — được cung cấp khi gửi biểu mẫu. Phụ huynh/người giám hộ có quyền xem, sửa hoặc yêu cầu xóa dữ liệu của con bất kỳ lúc nào.`
  },
  {
    title: "4. Cách Chúng Tôi Sử Dụng Thông Tin",
    content: `Chúng tôi sử dụng thông tin thu thập được để:
    • Cung cấp và cải thiện dịch vụ giáo dục
    • Liên lạc với bạn về các khóa học và lịch trình
    • Gửi báo cáo tiến độ cho phụ huynh
    • Xử lý thanh toán và lưu giữ hồ sơ
    • Gửi tài liệu quảng cáo (chỉ khi có sự đồng ý của bạn)`
  },
  {
    title: "5. Chia Sẻ Thông Tin",
    content: `Chúng tôi không bán hoặc cho thuê dữ liệu cá nhân của bạn. Chúng tôi có thể chia sẻ với:
    • Giáo viên và nhân viên cho mục đích giáo dục
    • Nhà cung cấp dịch vụ hỗ trợ hoạt động (ví dụ: cổng thanh toán được cấp phép)
    • Cơ quan pháp luật khi được yêu cầu`
  },
  {
    title: "6. Lưu Trữ, Bảo Mật & Thời Gian Lưu Giữ",
    content: `Dữ liệu của bạn được lưu trên máy chủ đặt tại Việt Nam và được bảo vệ bằng các biện pháp kỹ thuật và tổ chức phù hợp (mã hóa, kiểm soát truy cập). Chúng tôi lưu giữ dữ liệu trong thời gian bạn sử dụng dịch vụ và theo thời hạn pháp luật yêu cầu, sau đó xóa an toàn. Chúng tôi sẽ thông báo cho cá nhân bị ảnh hưởng và cơ quan có thẩm quyền khi xảy ra sự cố lộ lọt dữ liệu theo quy định.`
  },
  {
    title: "7. Quyền Của Bạn",
    content: `Theo Nghị định 13/2023/NĐ-CP, bạn có quyền:
    • Được biết về việc xử lý dữ liệu của mình
    • Đồng ý và rút lại sự đồng ý bất kỳ lúc nào
    • Truy cập, sửa hoặc yêu cầu xóa dữ liệu
    • Hạn chế hoặc phản đối việc xử lý
    • Khiếu nại đến cơ quan có thẩm quyền`
  },
  {
    title: "8. Liên Hệ",
    content: `Đối với mọi yêu cầu về quyền riêng tư (truy cập, sửa, xóa hoặc rút lại sự đồng ý), vui lòng liên hệ:
    Email: privacy@leraacademy.edu.vn
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
      const data = await publicFetch("/api/cms-settings/map/privacy").catch(() => ({}));
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
