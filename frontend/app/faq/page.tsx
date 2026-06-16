"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";

interface FAQ {
  id: string;
  question: string;
  questionVi?: string;
  answer: string;
  answerVi?: string;
  category?: string;
  order?: number;
}

// Fallback FAQ data
const fallbackFAQs: FAQ[] = [
  {
    id: "1",
    question: "What age groups do you teach?",
    questionVi: "LERA Academy dạy cho độ tuổi nào?",
    answer: "LERA Academy offers programs for learners of all ages, from 3 years old to adults. We have specialized programs for Kids (3-6), Primary (7-11), Secondary (12-15), High School (16-18), and Adults (18+).",
    answerVi: "LERA Academy cung cấp chương trình cho học viên mọi lứa tuổi, từ 3 tuổi đến người lớn. Chúng tôi có các chương trình chuyên biệt cho Mầm non (3-6 tuổi), Tiểu học (7-11 tuổi), THCS (12-15 tuổi), THPT (16-18 tuổi), và Người lớn (18+).",
    category: "General",
  },
  {
    id: "2",
    question: "Who are your teachers?",
    questionVi: "Giáo viên của LERA là ai?",
    answer: "Our teaching staff consists of highly qualified native English speakers and experienced local teachers. All teachers have relevant teaching certifications (TEFL, TESOL, CELTA) and undergo rigorous training before joining our team.",
    answerVi: "Đội ngũ giảng dạy của chúng tôi bao gồm các giáo viên bản ngữ có trình độ cao và giáo viên Việt Nam giàu kinh nghiệm. Tất cả giáo viên đều có chứng chỉ giảng dạy (TEFL, TESOL, CELTA) và trải qua quá trình đào tạo nghiêm ngặt.",
    category: "Teachers",
  },
  {
    id: "3",
    question: "What is the class size?",
    questionVi: "Sĩ số lớp học là bao nhiêu?",
    answer: "We maintain small class sizes to ensure personalized attention. Our group classes typically have 6-12 students, while semi-private classes have 2-4 students. We also offer 1-on-1 private tutoring.",
    answerVi: "Chúng tôi duy trì sĩ số lớp nhỏ để đảm bảo sự chú ý cá nhân hóa. Lớp nhóm thường có 6-12 học viên, lớp bán tư có 2-4 học viên. Chúng tôi cũng cung cấp dịch vụ gia sư 1-1.",
    category: "Classes",
  },
  {
    id: "4",
    question: "What teaching methodology do you use?",
    questionVi: "LERA sử dụng phương pháp giảng dạy gì?",
    answer: "We use the Communicative Language Teaching (CLT) approach, combined with modern interactive methods. Our lessons focus on practical communication skills through activities, games, discussions, and real-life scenarios.",
    answerVi: "Chúng tôi sử dụng phương pháp Giao tiếp Ngôn ngữ (CLT), kết hợp với các phương pháp tương tác hiện đại. Bài học tập trung vào kỹ năng giao tiếp thực tế thông qua hoạt động, trò chơi, thảo luận và tình huống thực tế.",
    category: "Teaching",
  },
  {
    id: "5",
    question: "How much does it cost?",
    questionVi: "Học phí là bao nhiêu?",
    answer: "Our fees vary depending on the program type, duration, and class format. Please contact us or visit your nearest center for detailed pricing. We offer flexible payment plans and special discounts for early registration and siblings.",
    answerVi: "Học phí phụ thuộc vào loại chương trình, thời lượng và hình thức lớp học. Vui lòng liên hệ hoặc đến trung tâm gần nhất để biết chi tiết. Chúng tôi có nhiều gói thanh toán linh hoạt và ưu đãi đặc biệt cho đăng ký sớm và anh chị em.",
    category: "Pricing",
  },
  {
    id: "6",
    question: "Do you offer trial classes?",
    questionVi: "LERA có lớp học thử không?",
    answer: "Yes! We offer free trial classes so you can experience our teaching quality firsthand. Contact us to schedule a free assessment and trial lesson at your preferred center.",
    answerVi: "Có! Chúng tôi cung cấp lớp học thử miễn phí để bạn trải nghiệm chất lượng giảng dạy. Liên hệ để đặt lịch kiểm tra trình độ và buổi học thử miễn phí tại trung tâm bạn chọn.",
    category: "General",
  },
  {
    id: "7",
    question: "What certifications can students earn?",
    questionVi: "Học viên có thể nhận được chứng chỉ gì?",
    answer: "Students receive LERA Academy certificates upon course completion. We also prepare students for international exams including Cambridge (KET, PET, FCE), IELTS, and TOEFL. Many of our students achieve excellent scores in these exams.",
    answerVi: "Học viên nhận chứng chỉ LERA Academy khi hoàn thành khóa học. Chúng tôi cũng chuẩn bị cho học viên các kỳ thi quốc tế như Cambridge (KET, PET, FCE), IELTS và TOEFL. Nhiều học viên đạt điểm số xuất sắc trong các kỳ thi này.",
    category: "Certifications",
  },
  {
    id: "8",
    question: "What are your center locations?",
    questionVi: "Các trung tâm của LERA ở đâu?",
    answer: "LERA Academy has multiple centers across the city for your convenience. Visit our Centers page or contact us to find the nearest location to your home or workplace.",
    answerVi: "LERA Academy có nhiều trung tâm trong thành phố để thuận tiện cho bạn. Xem trang Trung tâm hoặc liên hệ để tìm địa điểm gần nhà hoặc nơi làm việc nhất.",
    category: "General",
  },
  {
    id: "9",
    question: "Can parents track their child's progress?",
    questionVi: "Phụ huynh có thể theo dõi tiến độ con em không?",
    answer: "Absolutely! Parents have access to our online portal where they can view attendance, grades, homework, and teacher feedback. We also provide regular progress reports and parent-teacher meetings.",
    answerVi: "Hoàn toàn được! Phụ huynh có quyền truy cập cổng thông tin trực tuyến để xem điểm danh, điểm số, bài tập và phản hồi của giáo viên. Chúng tôi cũng cung cấp báo cáo tiến độ định kỳ và họp phụ huynh-giáo viên.",
    category: "Parents",
  },
  {
    id: "10",
    question: "Do you offer online classes?",
    questionVi: "LERA có lớp học trực tuyến không?",
    answer: "Yes, we offer hybrid learning options including fully online classes and blended learning. Our online platform provides interactive lessons, video calls with teachers, and digital learning materials.",
    answerVi: "Có, chúng tôi cung cấp các lựa chọn học tập kết hợp bao gồm lớp học hoàn toàn trực tuyến và học tập kết hợp. Nền tảng trực tuyến cung cấp bài học tương tác, cuộc gọi video với giáo viên và tài liệu học tập số.",
    category: "Classes",
  },
];

export default function FAQPage() {
  const { language } = useLanguage();
  const isVietnamese = language === "VI";
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const data = await publicFetch("/api/faqs/public");
      setFaqs(Array.isArray(data) ? data : data.content || fallbackFAQs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setFaqs(fallbackFAQs);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...Array.from(new Set(faqs.map((faq) => faq.category || "General")))];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const question = isVietnamese ? faq.questionVi || faq.question : faq.question;
    const answer = isVietnamese ? faq.answerVi || faq.answer : faq.answer;
    const matchesSearch =
      question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const t = {
    title: isVietnamese ? "Câu Hỏi Thường Gặp" : "Frequently Asked Questions",
    subtitle: isVietnamese
      ? "Tìm câu trả lời cho các câu hỏi phổ biến về LERA Academy"
      : "Find answers to common questions about LERA Academy",
    searchPlaceholder: isVietnamese ? "Tìm kiếm câu hỏi..." : "Search questions...",
    allCategories: isVietnamese ? "Tất cả" : "All",
    noResults: isVietnamese ? "Không tìm thấy câu hỏi nào" : "No questions found",
    stillHaveQuestions: isVietnamese ? "Vẫn còn thắc mắc?" : "Still have questions?",
    contactUsText: isVietnamese
      ? "Không tìm thấy câu trả lời? Liên hệ với chúng tôi để được hỗ trợ."
      : "Can't find what you're looking for? Contact us for help.",
    contactButton: isVietnamese ? "Liên Hệ Chúng Tôi" : "Contact Us",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h1>
            <p className="text-xl text-blue-100">{t.subtitle}</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category === "all" ? t.allCategories : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading FAQs...</p>
              </div>
            ) : filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noResults}</h3>
                <p className="text-gray-500">Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${
                      openIndex === index ? "shadow-lg ring-2 ring-blue-100" : ""
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 pr-4">
                          {isVietnamese ? faq.questionVi || faq.question : faq.question}
                        </h3>
                      </div>
                      <span
                        className={`flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center transition-transform duration-300 ${
                          openIndex === index ? "rotate-180 bg-blue-100" : ""
                        }`}
                      >
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openIndex === index ? "max-h-96" : "max-h-0"
                      }`}
                    >
                      <div className="px-6 pb-5 pl-[4.5rem]">
                        <p className="text-gray-600 leading-relaxed">
                          {isVietnamese ? faq.answerVi || faq.answer : faq.answer}
                        </p>
                        {faq.category && (
                          <span className="inline-block mt-3 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
                            {faq.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">{t.stillHaveQuestions}</h2>
            <p className="text-blue-100 mb-8">{t.contactUsText}</p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:bg-blue-50 transition-colors shadow-lg"
            >
              {t.contactButton}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
