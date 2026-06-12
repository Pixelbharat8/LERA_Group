/**
 * Dynamic Form Configuration
 * Add/remove fields easily by modifying these arrays
 */

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'checkbox' | 'file' | 'password';
  required: boolean;
  placeholder?: string;
  section: string;
  options?: FormFieldOption[];
  width?: 'full' | 'half' | 'third';
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  dependsOn?: {
    field: string;
    value: string | boolean;
  };
}

// =============================================
// STUDENT FORM FIELDS
// =============================================
export const STUDENT_FORM_FIELDS: FormFieldConfig[] = [
  // Basic Information
  { name: 'fullName', label: 'Full Name', type: 'text', required: true, section: 'basic', width: 'half' },
  { name: 'fullNameVi', label: 'Vietnamese Name', type: 'text', required: false, section: 'basic', width: 'half' },
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'basic', width: 'half' },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, section: 'basic', width: 'half' },
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'basic', width: 'half' },
  { name: 'gender', label: 'Gender', type: 'select', required: true, section: 'basic', width: 'half', options: [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ]},
  { name: 'address', label: 'Address', type: 'textarea', required: false, section: 'basic', width: 'full' },
  { name: 'avatarUrl', label: 'Profile Photo', type: 'file', required: false, section: 'basic', width: 'full' },
  
  // Academic Information
  { name: 'studentCode', label: 'Student Code', type: 'text', required: false, section: 'academic', width: 'half', placeholder: 'Auto-generated if empty' },
  { name: 'centerId', label: 'Center/Branch', type: 'select', required: true, section: 'academic', width: 'half', options: [] },
  { name: 'classId', label: 'Class', type: 'select', required: false, section: 'academic', width: 'half', options: [] },
  { name: 'programId', label: 'Program', type: 'select', required: false, section: 'academic', width: 'half', options: [] },
  { name: 'enrollmentDate', label: 'Enrollment Date', type: 'date', required: false, section: 'academic', width: 'half' },
  { name: 'status', label: 'Status', type: 'select', required: true, section: 'academic', width: 'half', options: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'GRADUATED', label: 'Graduated' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
  ]},
  
  // Parent/Guardian Information
  { name: 'parentName', label: 'Parent/Guardian Name', type: 'text', required: true, section: 'parent', width: 'half' },
  { name: 'parentPhone', label: 'Parent Phone', type: 'tel', required: true, section: 'parent', width: 'half' },
  { name: 'parentEmail', label: 'Parent Email', type: 'email', required: false, section: 'parent', width: 'half' },
  { name: 'relationship', label: 'Relationship', type: 'select', required: false, section: 'parent', width: 'half', options: [
    { value: 'FATHER', label: 'Father' },
    { value: 'MOTHER', label: 'Mother' },
    { value: 'GUARDIAN', label: 'Guardian' },
    { value: 'OTHER', label: 'Other' },
  ]},
  { name: 'parentOccupation', label: 'Parent Occupation', type: 'text', required: false, section: 'parent', width: 'half' },
  { name: 'emergencyContact', label: 'Emergency Contact', type: 'tel', required: false, section: 'parent', width: 'half' },
  
  // Medical Information
  { name: 'bloodGroup', label: 'Blood Group', type: 'select', required: false, section: 'medical', width: 'half', options: [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ]},
  { name: 'allergies', label: 'Allergies', type: 'textarea', required: false, section: 'medical', width: 'full' },
  { name: 'medicalNotes', label: 'Medical Notes', type: 'textarea', required: false, section: 'medical', width: 'full' },
  
  // Additional Information
  { name: 'referralSource', label: 'Referral Source', type: 'select', required: false, section: 'additional', width: 'half', options: [
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'GOOGLE', label: 'Google' },
    { value: 'FRIEND', label: 'Friend/Family' },
    { value: 'WALK_IN', label: 'Walk-in' },
    { value: 'OTHER', label: 'Other' },
  ]},
  { name: 'referredBy', label: 'Referred By (Student ID)', type: 'text', required: false, section: 'additional', width: 'half' },
  { name: 'notes', label: 'Notes', type: 'textarea', required: false, section: 'additional', width: 'full' },
];

// =============================================
// TEACHER FORM FIELDS
// =============================================
export const TEACHER_FORM_FIELDS: FormFieldConfig[] = [
  // Basic Information
  { name: 'fullName', label: 'Full Name', type: 'text', required: true, section: 'basic', width: 'half' },
  { name: 'fullNameVi', label: 'Vietnamese Name', type: 'text', required: false, section: 'basic', width: 'half' },
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'basic', width: 'half' },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, section: 'basic', width: 'half' },
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false, section: 'basic', width: 'half' },
  { name: 'gender', label: 'Gender', type: 'select', required: false, section: 'basic', width: 'half', options: [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ]},
  { name: 'address', label: 'Address', type: 'textarea', required: false, section: 'basic', width: 'full' },
  { name: 'avatarUrl', label: 'Profile Photo', type: 'file', required: false, section: 'basic', width: 'full' },
  
  // Professional Information
  { name: 'teacherCode', label: 'Teacher Code', type: 'text', required: false, section: 'professional', width: 'half', placeholder: 'Auto-generated if empty' },
  { name: 'centerId', label: 'Center/Branch', type: 'select', required: true, section: 'professional', width: 'half', options: [] },
  { name: 'specialization', label: 'Specialization', type: 'select', required: true, section: 'professional', width: 'half', options: [
    { value: 'ENGLISH', label: 'English' },
    { value: 'MATH', label: 'Mathematics' },
    { value: 'SCIENCE', label: 'Science' },
    { value: 'VIETNAMESE', label: 'Vietnamese' },
    { value: 'MUSIC', label: 'Music' },
    { value: 'ART', label: 'Art' },
    { value: 'PE', label: 'Physical Education' },
    { value: 'OTHER', label: 'Other' },
  ]},
  { name: 'qualification', label: 'Highest Qualification', type: 'select', required: false, section: 'professional', width: 'half', options: [
    { value: 'BACHELOR', label: 'Bachelor\'s Degree' },
    { value: 'MASTER', label: 'Master\'s Degree' },
    { value: 'PHD', label: 'PhD' },
    { value: 'DIPLOMA', label: 'Diploma' },
    { value: 'CERTIFICATE', label: 'Certificate' },
  ]},
  { name: 'experienceYears', label: 'Years of Experience', type: 'number', required: false, section: 'professional', width: 'half' },
  { name: 'certifications', label: 'Certifications', type: 'textarea', required: false, section: 'professional', width: 'full', placeholder: 'TESOL, CELTA, etc.' },
  
  // Employment Information
  { name: 'employmentType', label: 'Employment Type', type: 'select', required: true, section: 'employment', width: 'half', options: [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'FREELANCE', label: 'Freelance' },
  ]},
  { name: 'joinDate', label: 'Join Date', type: 'date', required: false, section: 'employment', width: 'half' },
  { name: 'baseSalary', label: 'Base Salary (VND)', type: 'number', required: false, section: 'employment', width: 'half' },
  { name: 'hourlyRate', label: 'Hourly Rate (VND)', type: 'number', required: false, section: 'employment', width: 'half' },
  { name: 'status', label: 'Status', type: 'select', required: true, section: 'employment', width: 'half', options: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'TERMINATED', label: 'Terminated' },
  ]},
  
  // Bank Information
  { name: 'bankName', label: 'Bank Name', type: 'text', required: false, section: 'bank', width: 'half' },
  { name: 'bankAccount', label: 'Bank Account Number', type: 'text', required: false, section: 'bank', width: 'half' },
  { name: 'taxId', label: 'Tax ID', type: 'text', required: false, section: 'bank', width: 'half' },
  
  // Additional Information
  { name: 'bio', label: 'Biography', type: 'textarea', required: false, section: 'additional', width: 'full' },
  { name: 'notes', label: 'Notes', type: 'textarea', required: false, section: 'additional', width: 'full' },
];

// =============================================
// USER FORM FIELDS
// =============================================
export const USER_FORM_FIELDS: FormFieldConfig[] = [
  { name: 'fullname', label: 'Full Name', type: 'text', required: true, section: 'basic', width: 'half' },
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'basic', width: 'half' },
  { name: 'phone', label: 'Phone', type: 'tel', required: false, section: 'basic', width: 'half' },
  { name: 'password', label: 'Password', type: 'password', required: true, section: 'basic', width: 'half' },
  { name: 'roleId', label: 'Role', type: 'select', required: true, section: 'basic', width: 'half', options: [] },
  { name: 'departmentId', label: 'Department', type: 'select', required: false, section: 'basic', width: 'half', options: [] },
  { name: 'centerId', label: 'Center', type: 'select', required: false, section: 'basic', width: 'half', options: [] },
  { name: 'status', label: 'Status', type: 'select', required: true, section: 'basic', width: 'half', options: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
  ]},
];

// =============================================
// CLASS FORM FIELDS
// =============================================
export const CLASS_FORM_FIELDS: FormFieldConfig[] = [
  { name: 'name', label: 'Class Name', type: 'text', required: true, section: 'basic', width: 'half' },
  { name: 'centerId', label: 'Center', type: 'select', required: true, section: 'basic', width: 'half', options: [] },
  { name: 'programId', label: 'Program', type: 'select', required: false, section: 'basic', width: 'half', options: [] },
  { name: 'teacherId', label: 'Teacher', type: 'select', required: false, section: 'basic', width: 'half', options: [] },
  { name: 'assistantTeacherId', label: 'Assistant Teacher', type: 'select', required: false, section: 'basic', width: 'half', options: [] },
  { name: 'room', label: 'Room', type: 'text', required: false, section: 'basic', width: 'half' },
  { name: 'maxStudents', label: 'Max Students', type: 'number', required: false, section: 'basic', width: 'half' },
  { name: 'startDate', label: 'Start Date', type: 'date', required: false, section: 'schedule', width: 'half' },
  { name: 'endDate', label: 'End Date', type: 'date', required: false, section: 'schedule', width: 'half' },
  { name: 'status', label: 'Status', type: 'select', required: true, section: 'basic', width: 'half', options: [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'ONGOING', label: 'Ongoing' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]},
];

// =============================================
// FORM SECTIONS
// =============================================
export const FORM_SECTIONS = {
  student: [
    { id: 'basic', title: 'Basic Information', icon: '👤' },
    { id: 'academic', title: 'Academic Information', icon: '📚' },
    { id: 'parent', title: 'Parent/Guardian', icon: '👨‍👩‍👧' },
    { id: 'medical', title: 'Medical Information', icon: '🏥' },
    { id: 'additional', title: 'Additional Information', icon: '📝' },
  ],
  teacher: [
    { id: 'basic', title: 'Basic Information', icon: '👤' },
    { id: 'professional', title: 'Professional Details', icon: '🎓' },
    { id: 'employment', title: 'Employment', icon: '💼' },
    { id: 'bank', title: 'Bank Details', icon: '🏦' },
    { id: 'additional', title: 'Additional Information', icon: '📝' },
  ],
  user: [
    { id: 'basic', title: 'User Information', icon: '👤' },
  ],
  class: [
    { id: 'basic', title: 'Class Information', icon: '📚' },
    { id: 'schedule', title: 'Schedule', icon: '📅' },
  ],
};

// =============================================
// EXCEL IMPORT COLUMNS
// =============================================
export const STUDENT_EXCEL_COLUMNS = [
  'fullName', 'email', 'phone', 'dateOfBirth', 'gender', 'address',
  'parentName', 'parentPhone', 'parentEmail', 'centerId', 'classId'
];

export const TEACHER_EXCEL_COLUMNS = [
  'fullName', 'email', 'phone', 'specialization', 'qualification',
  'experienceYears', 'dateOfBirth', 'gender', 'address', 'centerId'
];

// =============================================
// HELPER FUNCTIONS
// =============================================
export function getFieldsBySection(fields: FormFieldConfig[], section: string): FormFieldConfig[] {
  return fields.filter(f => f.section === section);
}

export function getRequiredFields(fields: FormFieldConfig[]): FormFieldConfig[] {
  return fields.filter(f => f.required);
}

export function validateForm(fields: FormFieldConfig[], data: Record<string, unknown>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const field of fields) {
    if (field.required && !data[field.name]) {
      errors[field.name] = `${field.label} is required`;
    }
    
    if (field.validation) {
      const value = data[field.name];
      if (field.validation.min && typeof value === 'number' && value < field.validation.min) {
        errors[field.name] = field.validation.message || `Minimum value is ${field.validation.min}`;
      }
      if (field.validation.max && typeof value === 'number' && value > field.validation.max) {
        errors[field.name] = field.validation.message || `Maximum value is ${field.validation.max}`;
      }
      if (field.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors[field.name] = field.validation.message || 'Invalid format';
        }
      }
    }
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}
