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
    title: "1. Acceptance of Terms",
    content: `By accessing or using LERA Academy's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.`
  },
  {
    title: "2. Services",
    content: `LERA Academy provides English language education services including:
    • In-person and online courses
    • AI-powered learning tools
    • Educational materials and resources
    • Progress tracking and assessments
    
    We reserve the right to modify or discontinue any service at any time.`
  },
  {
    title: "3. Registration and Enrollment",
    content: `To enroll in our courses, you must:
    • Provide accurate and complete information
    • Be at least 18 years old (or have parental consent)
    • Pay the applicable course fees
    • Comply with our attendance policies
    
    Enrollment is subject to availability and our acceptance.`
  },
  {
    title: "4. Payment and Refunds",
    content: `Payment terms:
    • Full payment is required before course commencement
    • We accept bank transfer, credit card, and cash payments
    
    Refund policy:
    • 100% refund if cancelled 7+ days before course start
    • 50% refund if cancelled 3-6 days before course start
    • No refund if cancelled less than 3 days before course start
    • Pro-rated refunds may be available for medical reasons`
  },
  {
    title: "5. Attendance and Conduct",
    content: `Students are expected to:
    • Attend classes regularly and on time
    • Participate actively in learning activities
    • Treat teachers and fellow students with respect
    • Follow classroom rules and center policies
    
    Excessive absences or disruptive behavior may result in termination of enrollment without refund.`
  },
  {
    title: "6. Intellectual Property",
    content: `All course materials, including but not limited to textbooks, worksheets, videos, and software, are the intellectual property of LERA Academy. Students may not reproduce, distribute, or share these materials without written permission.`
  },
  {
    title: "7. AI Tutor Usage",
    content: `Our AI tutoring service is provided for educational purposes only. By using the AI tutor:
    • You agree not to attempt to misuse or manipulate the system
    • You understand that AI responses are for learning support, not professional advice
    • You consent to your interactions being recorded for quality improvement`
  },
  {
    title: "8. Limitation of Liability",
    content: `LERA Academy is not liable for:
    • Learning outcomes or test scores (though we strive for best results)
    • Technical issues beyond our control
    • Loss of personal items at our centers
    
    Our maximum liability is limited to the course fees paid.`
  },
  {
    title: "9. Changes to Terms",
    content: `We may update these Terms of Service at any time. Continued use of our services after changes constitutes acceptance of the new terms. We will notify students of significant changes via email.`
  },
  {
    title: "10. Contact",
    content: `For questions about these Terms of Service, please contact:
    • Email: legal@lera.edu.vn
    • Phone: 0387.633.141
    • Address: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng`
  }
];

const defaultSectionsVI: Section[] = [
  {
    title: "1. Chấp Nhận Điều Khoản",
    content: `Bằng việc truy cập hoặc sử dụng dịch vụ của LERA Academy, bạn đồng ý tuân theo các Điều khoản Sử dụng này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi.`
  },
  {
    title: "2. Dịch Vụ",
    content: `LERA Academy cung cấp dịch vụ giáo dục tiếng Anh bao gồm:
    • Khóa học trực tiếp và trực tuyến
    • Công cụ học tập AI
    • Tài liệu và nguồn học tập
    • Theo dõi tiến độ và đánh giá
    
    Chúng tôi có quyền thay đổi hoặc ngừng bất kỳ dịch vụ nào.`
  },
  {
    title: "3. Đăng Ký và Ghi Danh",
    content: `Để đăng ký khóa học, bạn phải:
    • Cung cấp thông tin chính xác và đầy đủ
    • Từ 18 tuổi trở lên (hoặc có sự đồng ý của phụ huynh)
    • Thanh toán học phí
    • Tuân thủ chính sách điểm danh
    
    Việc ghi danh phụ thuộc vào tình trạng chỗ và sự chấp thuận của chúng tôi.`
  },
  {
    title: "4. Thanh Toán và Hoàn Tiền",
    content: `Điều khoản thanh toán:
    • Thanh toán đầy đủ trước khi khóa học bắt đầu
    • Chấp nhận chuyển khoản, thẻ tín dụng và tiền mặt
    
    Chính sách hoàn tiền:
    • Hoàn 100% nếu hủy trước 7+ ngày
    • Hoàn 50% nếu hủy trước 3-6 ngày
    • Không hoàn nếu hủy dưới 3 ngày
    • Có thể hoàn theo tỷ lệ vì lý do y tế`
  },
  {
    title: "5. Điểm Danh và Nội Quy",
    content: `Học viên được yêu cầu:
    • Đi học đều đặn và đúng giờ
    • Tham gia tích cực vào hoạt động học tập
    • Tôn trọng giáo viên và học viên khác
    • Tuân thủ nội quy lớp học và trung tâm
    
    Vắng mặt quá nhiều hoặc hành vi gây rối có thể bị đình chỉ mà không hoàn tiền.`
  },
  {
    title: "6. Sở Hữu Trí Tuệ",
    content: `Tất cả tài liệu khóa học, bao gồm sách giáo khoa, bài tập, video và phần mềm, là tài sản trí tuệ của LERA Academy. Học viên không được sao chép, phân phối hoặc chia sẻ tài liệu mà không có sự cho phép bằng văn bản.`
  },
  {
    title: "7. Sử Dụng AI Tutor",
    content: `Dịch vụ AI tutoring chỉ phục vụ mục đích giáo dục. Khi sử dụng AI tutor:
    • Bạn đồng ý không lạm dụng hoặc thao túng hệ thống
    • Bạn hiểu rằng phản hồi AI chỉ để hỗ trợ học tập
    • Bạn đồng ý cho ghi lại tương tác để cải thiện chất lượng`
  },
  {
    title: "8. Giới Hạn Trách Nhiệm",
    content: `LERA Academy không chịu trách nhiệm về:
    • Kết quả học tập hoặc điểm thi (dù chúng tôi cố gắng hết sức)
    • Sự cố kỹ thuật ngoài tầm kiểm soát
    • Mất đồ cá nhân tại trung tâm
    
    Trách nhiệm tối đa giới hạn ở mức học phí đã thanh toán.`
  },
  {
    title: "9. Thay Đổi Điều Khoản",
    content: `Chúng tôi có thể cập nhật Điều khoản Sử dụng bất cứ lúc nào. Việc tiếp tục sử dụng dịch vụ sau thay đổi đồng nghĩa với việc chấp nhận điều khoản mới. Chúng tôi sẽ thông báo các thay đổi quan trọng qua email.`
  },
  {
    title: "10. Liên Hệ",
    content: `Để biết thêm về Điều khoản Sử dụng, vui lòng liên hệ:
    • Email: legal@lera.edu.vn
    • Điện thoại: 0387.633.141
    • Địa chỉ: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng`
  }
];

export default function TermsPage() {
  const { language } = useLanguage();
  const [sectionsEN, setSectionsEN] = useState<Section[]>(defaultSectionsEN);
  const [sectionsVI, setSectionsVI] = useState<Section[]>(defaultSectionsVI);
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
      const data = await apiFetch("/api/cms-settings/map/terms").catch(() => ({}));
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
