/**
 * The published wording of the privacy policy and the terms of service.
 *
 * These live here, in one place, because they were duplicated: the public pages carried the real
 * documents while each admin editor seeded its own shorter draft. Opening an editor and pressing
 * Save — the ordinary thing to do after changing one field — published the editor's version, and
 * that version was missing whole sections of the live document:
 *
 *   privacy  lost "Scope & Legal Basis" (which cites Vietnam's Personal Data Protection Decree,
 *            Nghị định 13/2023/NĐ-CP), "Children's Data & Parental Consent", and the data
 *            storage/retention section;
 *   terms    lost "AI Tutor Usage", "Limitation of Liability", "Changes to Terms" and "Contact".
 *
 * For a company teaching children in Vietnam, quietly dropping the parental-consent section and
 * the legal basis for processing is not a cosmetic regression, and nothing about the UI showed it
 * happening. Both the public pages and both editors now read these same constants.
 *
 * NOTE: this is the DEFAULT wording only. Once content is saved under the `privacy` / `terms` CMS
 * categories it takes precedence. As of this writing nothing is saved, so this is what the public
 * site actually serves — it has not been reviewed by anyone at LERA and should be.
 */
export interface LegalSection {
  title: string;
  content: string;
}

export const PRIVACY_SECTIONS_EN: LegalSection[] = [
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

export const PRIVACY_SECTIONS_VI: LegalSection[] = [
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

export const TERMS_SECTIONS_EN: LegalSection[] = [
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
    • Email: legal@leraacademy.edu.vn
    • Phone: 0387.633.141
    • Address: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng`
  }
];

export const TERMS_SECTIONS_VI: LegalSection[] = [
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
    • Email: legal@leraacademy.edu.vn
    • Điện thoại: 0387.633.141
    • Địa chỉ: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng`
  }
];
