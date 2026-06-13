"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiFetch } from "../../lib/api";
import Image from "next/image";
import { GALLERY_IMAGES, HERO_IMAGES } from "../../config/images";

// Types for dynamic content
interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  workingDays: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  zaloUrl: string;
  mapEmbedUrl: string;
}

interface FaqItem {
  id: string;
  questionEN: string;
  questionVI: string;
  answerEN: string;
  answerVI: string;
  order: number;
}

// Default contact info (fallback) - REAL DATA from LERA Academy
const defaultContactInfo: ContactInfo = {
  address: "95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng",
  phone: "0387.633.141",
  email: "info@lera.edu.vn",
  workingHours: "8:00 AM - 9:00 PM",
  workingDays: "Monday - Sunday",
  facebookUrl: "https://www.facebook.com/profile.php?id=61580971978601",
  instagramUrl: "https://instagram.com/leraacademy",
  tiktokUrl: "https://tiktok.com/@leraacademy",
  zaloUrl: "https://zalo.me/0387633141",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3727.5!2d106.7!3d20.87!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a7a9e81eb07c3%3A0x1234567890abcdef!2sVinhomes%20Marina!5e0!3m2!1sen!2s!4v1234567890"
};

// Default FAQs (fallback)
const defaultFaqs: FaqItem[] = [
  {
    id: "1",
    questionEN: "What age groups do you teach?",
    questionVI: "Bạn dạy các nhóm tuổi nào?",
    answerEN: "We teach students from 3 years old to adults. Our programs include LERA Starters (3-6 years), Speaking Pro (6-10 years), LERA Teens (10-15 years), and adult courses including IELTS and Business English.",
    answerVI: "Chúng tôi dạy học viên từ 3 tuổi đến người lớn. Các chương trình bao gồm LERA Starters (3-6 tuổi), Speaking Pro (6-10 tuổi), LERA Teens (10-15 tuổi), và các khóa học cho người lớn bao gồm IELTS và Tiếng Anh thương mại.",
    order: 1
  },
  {
    id: "2",
    questionEN: "How long is each course?",
    questionVI: "Mỗi khóa học kéo dài bao lâu?",
    answerEN: "Courses typically run for 12-16 weeks, with 2-3 sessions per week. Each session lasts 60-90 minutes depending on the age group.",
    answerVI: "Các khóa học thường kéo dài 12-16 tuần, với 2-3 buổi mỗi tuần. Mỗi buổi học kéo dài 60-90 phút tùy theo độ tuổi.",
    order: 2
  },
  {
    id: "3",
    questionEN: "Do you offer trial classes?",
    questionVI: "Bạn có cung cấp lớp học thử không?",
    answerEN: "Yes! We offer a free trial class for all new students. Register through our website or call us to schedule your trial session.",
    answerVI: "Có! Chúng tôi cung cấp lớp học thử miễn phí cho tất cả học viên mới. Đăng ký qua website hoặc gọi điện để đặt lịch học thử.",
    order: 3
  },
  {
    id: "4",
    questionEN: "What qualifications do your teachers have?",
    questionVI: "Giáo viên của bạn có bằng cấp gì?",
    answerEN: "All our teachers are native English speakers from USA, UK, and Australia. They hold international teaching certificates such as CELTA, TESOL, or TEFL with at least 2 years of teaching experience.",
    answerVI: "Tất cả giáo viên của chúng tôi đều là người bản ngữ từ Mỹ, Anh và Úc. Họ có chứng chỉ giảng dạy quốc tế như CELTA, TESOL, hoặc TEFL với ít nhất 2 năm kinh nghiệm.",
    order: 4
  },
  {
    id: "5",
    questionEN: "What is your refund policy?",
    questionVI: "Chính sách hoàn tiền của bạn là gì?",
    answerEN: "We offer a full refund within the first 2 weeks if you're not satisfied. After that, pro-rated refunds are available based on remaining classes.",
    answerVI: "Chúng tôi hoàn tiền 100% trong 2 tuần đầu nếu bạn không hài lòng. Sau đó, hoàn tiền theo tỷ lệ dựa trên số buổi còn lại.",
    order: 5
  },
  {
    id: "6",
    questionEN: "Can parents observe classes?",
    questionVI: "Phụ huynh có thể quan sát lớp học không?",
    answerEN: "Yes! Parents can observe classes through our viewing windows or via live video stream. We believe in transparency and parent involvement in the learning journey.",
    answerVI: "Có! Phụ huynh có thể quan sát lớp học qua cửa kính hoặc qua video trực tiếp. Chúng tôi tin vào sự minh bạch và sự tham gia của phụ huynh trong hành trình học tập.",
    order: 6
  }
];

// Gallery images from LERA Academy (using centralized config)
const galleryImages = GALLERY_IMAGES;

export default function ContactPage() {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [cmsData, setCmsData] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState<FaqItem[]>(defaultFaqs);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic content from CMS
  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Try to fetch contact settings from CMS
        const settings = await apiFetch("/api/cms-settings/map/contact");
        if (settings && typeof settings === 'object') {
          setCmsData(settings);
          const langKey = language === 'VI' ? 'vi' : 'en';
          setContactInfo({
            address: settings[`contact_address_${langKey}`] || settings.contact_address || defaultContactInfo.address,
            phone: settings.contact_phone || defaultContactInfo.phone,
            email: settings.contact_email || defaultContactInfo.email,
            workingHours: settings[`contact_working_hours_${langKey}`] || settings.contact_hours || defaultContactInfo.workingHours,
            workingDays: settings.contact_days || defaultContactInfo.workingDays,
            facebookUrl: settings.social_facebook || defaultContactInfo.facebookUrl,
            instagramUrl: settings.social_instagram || defaultContactInfo.instagramUrl,
            tiktokUrl: settings.social_tiktok || defaultContactInfo.tiktokUrl,
            zaloUrl: settings.social_zalo || defaultContactInfo.zaloUrl,
            mapEmbedUrl: settings.map_embed_url || defaultContactInfo.mapEmbedUrl,
          });
        }
      } catch (error) {
        console.log("Using default contact info");
      }

      try {
        // Try to fetch FAQs from API
        const faqData = await apiFetch("/api/faqs?page=contact");
        if (Array.isArray(faqData) && faqData.length > 0) {
          setFaqs(faqData);
        }
      } catch (error) {
        console.log("Using default FAQs");
      }

      setIsLoading(false);
    };

    fetchContent();
  }, []);

  // Update language-specific fields when language changes
  useEffect(() => {
    if (Object.keys(cmsData).length > 0) {
      const langKey = language === 'VI' ? 'vi' : 'en';
      setContactInfo(prev => ({
        ...prev,
        address: cmsData[`contact_address_${langKey}`] || cmsData.contact_address || defaultContactInfo.address,
        workingHours: cmsData[`contact_working_hours_${langKey}`] || cmsData.contact_hours || defaultContactInfo.workingHours,
      }));
    }
  }, [language, cmsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const leadData = {
        parentName: formData.name,
        parentPhone: defaultContactInfo.phone,
        parentEmail: formData.email,
        notes: `Contact Form - Subject: ${formData.subject}\nMessage: ${formData.message}`,
        utmSource: "website",
        utmMedium: "contact_form",
        utmCampaign: "contact_page",
        website: formData.website,
      };
      
      await apiFetch("/api/public/leads", {
        method: "POST",
        body: JSON.stringify(leadData)
      });
      
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (err) {
      console.error("Error submitting contact form:", err);
      alert(language === "EN" ? "Failed to send message. Please try again." : "Gửi tin nhắn thất bại. Vui lòng thử lại.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section with Background Image */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: `url('${HERO_IMAGES.contact}')`}}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/50"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {language === "EN" ? "🌟 We're here to help!" : "🌟 Chúng tôi sẵn sàng hỗ trợ bạn!"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("contactHeroTitle")}</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">{t("contactHeroDesc")}</p>
        </div>
      </section>
      
      {/* Contact Form & Info Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("sendMessage")}</h2>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl text-green-600">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {language === "EN" ? "Message Sent!" : "Đã gửi tin nhắn!"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {language === "EN" ? "We'll get back to you within 24 hours." : "Chúng tôi sẽ phản hồi trong vòng 24 giờ."}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    {language === "EN" ? "Send Another Message" : "Gửi tin nhắn khác"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                    placeholder={t("yourName")} 
                  />
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                    placeholder={t("yourEmail")} 
                  />
                  <input 
                    type="text" 
                    required 
                    value={formData.subject} 
                    onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
                    placeholder={t("subject")} 
                  />
                  <textarea 
                    required 
                    rows={4} 
                    value={formData.message} 
                    onChange={(e) => setFormData({...formData, message: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" 
                    placeholder={t("message")} 
                  />
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {isSubmitting ? (language === "EN" ? "Sending..." : "Đang gửi...") : t("sendMessage")}
                  </button>
                </form>
              )}
            </div>
            <div className="bg-blue-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t("getInTouch")}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">📍</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{language === "EN" ? "Address" : "Địa chỉ"}</p>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{language === "EN" ? "Phone" : "Điện thoại"}</p>
                    <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-800 transition-colors">{contactInfo.phone}</a>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:text-blue-800 transition-colors">{contactInfo.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">🕐</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{language === "EN" ? "Working Hours" : "Giờ làm việc"}</p>
                    <p className="text-gray-600">{contactInfo.workingHours}</p>
                    <p className="text-gray-500 text-sm">{language === "EN" ? contactInfo.workingDays : "Thứ Hai - Chủ Nhật"}</p>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="mt-8 pt-6 border-t border-blue-100">
                <p className="font-semibold text-gray-900 mb-4">{language === "EN" ? "Follow Us" : "Theo dõi chúng tôi"}</p>
                <div className="flex gap-3">
                  <a href={contactInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors hover:scale-110">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                  </a>
                  <a href={contactInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-full flex items-center justify-center hover:opacity-90 transition-all hover:scale-110">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a href={contactInfo.tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                  </a>
                  <a href={contactInfo.zaloUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-110">
                    <span className="text-xs font-bold">Zalo</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Photo Gallery Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {language === "EN" ? "Life at LERA Academy" : "Cuộc sống tại LERA Academy"}
          </h2>
          <p className="text-gray-600 text-center mb-12">
            {language === "EN" ? "See our vibrant learning environment and happy students" : "Xem môi trường học tập sôi động và học viên vui vẻ của chúng tôi"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-100">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <p className="text-white font-medium p-4">{language === "EN" ? image.caption.EN : image.caption.VI}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a 
              href={contactInfo.facebookUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
              {language === "EN" ? "See More on Facebook" : "Xem thêm trên Facebook"}
            </a>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {language === "EN" ? "Frequently Asked Questions" : "Câu hỏi thường gặp"}
          </h2>
          <p className="text-gray-600 text-center mb-12">
            {language === "EN" ? "Find answers to common questions about our courses and services" : "Tìm câu trả lời cho các câu hỏi thường gặp về khóa học và dịch vụ"}
          </p>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)} 
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{language === "EN" ? faq.questionEN : faq.questionVI}</span>
                  <span className={`text-blue-600 text-xl font-bold transition-transform duration-200 ${openFaq === index ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">{language === "EN" ? faq.answerEN : faq.answerVI}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {language === "EN" ? "Find Us" : "Tìm chúng tôi"}
          </h2>
          <p className="text-gray-600 text-center mb-8">
            {language === "EN" ? "Visit our learning center in Hải Phòng" : "Ghé thăm trung tâm học tập của chúng tôi tại Hải Phòng"}
          </p>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3728.5!2d106.68!3d20.84!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a7a7b6a7a7a7a%3A0x314a7a7a7a7a7a7a!2zTOG6oWNoIFRyYXksIE5nw7QgUXV54buBbiwgSOG6o2kgUGjDsm5n!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
              width="100%" 
              height="400" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            ></iframe>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <span className="text-xl">🗺️</span>
              {language === "EN" ? "Get Directions" : "Chỉ đường"}
            </a>
            <a 
              href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <span className="text-xl">📞</span>
              {language === "EN" ? "Call Us Now" : "Gọi ngay"}
            </a>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === "EN" ? "Ready to Start Learning?" : "Sẵn sàng bắt đầu học?"}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {language === "EN" ? "Register for a free trial class today!" : "Đăng ký lớp học thử miễn phí ngay hôm nay!"}
          </p>
          <a 
            href="/" 
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            {language === "EN" ? "Register Now →" : "Đăng ký ngay →"}
          </a>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
