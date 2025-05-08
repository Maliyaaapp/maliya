// Mock API service for school finance management system
import { WHATSAPP_API_URL } from '../utils/constants';
import { Query } from 'appwrite';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID, SCHOOLS_COLLECTION_ID, ADMIN_EMAIL } from './appwrite';
import { ID } from 'appwrite';

// Interface for API response
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Add interfaces for our data types
interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  active: boolean;
  subscriptionStart: string;
  subscriptionEnd: string;
  logo: string;
}

interface Student {
  id: string;
  schoolId: string;
  grade: string;
  name: string;
  parentName: string;
  phone: string;
  transportation: string;
}

interface Fee {
  id: string;
  schoolId: string;
  studentId: string;
  type: string;
  amount: number;
  discount: number;
  dueDate: string;
}

interface Installment {
  id: string;
  schoolId: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface Message {
  id: string;
  schoolId: string;
  phone: string;
  message: string;
  sentAt: string;
  status: string;
}

interface Account {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId?: string;
  createdAt: string;
}

// Initialize mock database from localStorage or use defaults
const initializeMockDb = () => {
  // Try to get schools from localStorage
  let schools = [];
  const savedSchools = localStorage.getItem('schools');
  if (savedSchools) {
    try {
      schools = JSON.parse(savedSchools);
    } catch (e) {
      console.error('Error parsing schools from localStorage:', e);
      schools = getDefaultSchools();
    }
  } else {
    schools = getDefaultSchools();
    localStorage.setItem('schools', JSON.stringify(schools));
  }
  
  // Try to get accounts from localStorage
  let accounts = [];
  const savedAccounts = localStorage.getItem('accounts');
  if (savedAccounts) {
    try {
      accounts = JSON.parse(savedAccounts);
    } catch (e) {
      console.error('Error parsing accounts from localStorage:', e);
    }
  }
  
  // Try to get students from localStorage
  let students = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      students = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Try to get fees from localStorage
  let fees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      fees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  return {
    schools,
    accounts,
    students,
    fees,
    installments: [],
    messages: []
  };
};

// Default schools data
const getDefaultSchools = () => [];

// Initialize mock database
const mockDb = initializeMockDb();

// Simulate API delay
const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Schools API
export const getSchools = async (): Promise<ApiResponse> => {
  await simulateDelay();
  return { success: true, data: mockDb.schools };
};

export const getSchool = async (id: string): Promise<ApiResponse> => {
  await simulateDelay();
  const school = mockDb.schools.find((s: School) => s.id === id);
  return school 
    ? { success: true, data: school }
    : { success: false, error: 'مدرسة غير موجودة' };
};

export const createSchool = async (schoolData: any): Promise<ApiResponse> => {
  await simulateDelay();
  const newId = String(Date.now());
  const newSchool = {
    id: newId,
    ...schoolData,
    active: true
  };
  mockDb.schools.push(newSchool);
  
  // Update localStorage
  localStorage.setItem('schools', JSON.stringify(mockDb.schools));
  
  return { success: true, data: newSchool };
};

export const updateSchool = async (id: string, schoolData: any): Promise<ApiResponse> => {
  await simulateDelay();
  const index = mockDb.schools.findIndex((s: School) => s.id === id);
  if (index === -1) {
    return { success: false, error: 'مدرسة غير موجودة' };
  }
  mockDb.schools[index] = { ...mockDb.schools[index], ...schoolData };
  
  // Update localStorage
  localStorage.setItem('schools', JSON.stringify(mockDb.schools));
  
  return { success: true, data: mockDb.schools[index] };
};

export const deleteSchool = async (id: string): Promise<ApiResponse> => {
  await simulateDelay();
  const index = mockDb.schools.findIndex((s: School) => s.id === id);
  if (index === -1) {
    return { success: false, error: 'مدرسة غير موجودة' };
  }
  
  // Delete the school
  mockDb.schools.splice(index, 1);
  
  // Update localStorage
  localStorage.setItem('schools', JSON.stringify(mockDb.schools));
  
  return { success: true };
};

// Students API
export const getStudents = async (schoolId?: string, gradeLevel?: string | string[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get students from localStorage
  let students = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      students = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Apply filters
  let filteredStudents = students;
  
  if (schoolId) {
    filteredStudents = filteredStudents.filter((s: Student) => s.schoolId === schoolId);
  }
  
  if (gradeLevel) {
    if (Array.isArray(gradeLevel)) {
      filteredStudents = filteredStudents.filter((s: Student) => gradeLevel.includes(s.grade));
    } else {
      filteredStudents = filteredStudents.filter((s: Student) => s.grade === gradeLevel);
    }
  }
  
  return { success: true, data: filteredStudents };
};

export const createStudent = async (studentData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing students
  let students = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      students = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Create new student
  const newId = String(Date.now());
  const newStudent = {
    id: newId,
    ...studentData
  };
  
  // Add to collection
  students.push(newStudent);
  
  // Update localStorage
  localStorage.setItem('students', JSON.stringify(students));
  
  return { success: true, data: newStudent };
};

export const importStudents = async (students: any[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing students
  let existingStudents = [];
  const savedStudents = localStorage.getItem('students');
  if (savedStudents) {
    try {
      existingStudents = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Error parsing students from localStorage:', e);
    }
  }
  
  // Generate IDs for new students
  const newStudents = students.map(student => ({
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    ...student
  }));
  
  // Combine and save
  const updatedStudents = [...existingStudents, ...newStudents];
  localStorage.setItem('students', JSON.stringify(updatedStudents));
  
  return { success: true, data: newStudents };
};

export const exportStudentsTemplate = (): Blob => {
  const headers = ['اسم الطالب', 'رقم الطالب', 'الصف', 'اسم ولي الأمر', 'رقم الهاتف', 'النقل'];
  const csvContent = [
    headers.join(','),
    'أحمد محمد,S1001,الروضة الأولى KG1,محمد أحمد,+968 95123456,اتجاهين',
    'فاطمة خالد,S1002,التمهيدي KG2,خالد علي,+968 95123457,اتجاه واحد',
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

// Fees API
export const getFees = async (schoolId?: string, studentId?: string, gradeLevel?: string | string[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get fees from localStorage
  let fees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      fees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  // Apply filters
  let filteredFees = fees;
  
  if (schoolId) {
    filteredFees = filteredFees.filter((f: Fee) => f.schoolId === schoolId);
  }
  
  if (studentId) {
    filteredFees = filteredFees.filter((f: Fee) => f.studentId === studentId);
  }
  
  if (gradeLevel) {
    // Get students in the grade(s)
    let students = [];
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        students = JSON.parse(savedStudents);
      } catch (e) {
        console.error('Error parsing students from localStorage:', e);
      }
    }
    
    let studentIds = [];
    if (Array.isArray(gradeLevel)) {
      studentIds = students
        .filter((s: Student) => gradeLevel.includes(s.grade))
        .map((s: Student) => s.id);
    } else {
      studentIds = students
        .filter((s: Student) => s.grade === gradeLevel)
        .map((s: Student) => s.id);
    }
    
    filteredFees = filteredFees.filter((f: Fee) => studentIds.includes(f.studentId));
  }
  
  return { success: true, data: filteredFees };
};

export const createFee = async (feeData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing fees
  let fees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      fees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  // Create new fee
  const newId = String(Date.now());
  const newFee = {
    id: newId,
    ...feeData
  };
  
  // Add to collection
  fees.push(newFee);
  
  // Update localStorage
  localStorage.setItem('fees', JSON.stringify(fees));
  
  return { success: true, data: newFee };
};

export const importFees = async (fees: any[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing fees
  let existingFees = [];
  const savedFees = localStorage.getItem('fees');
  if (savedFees) {
    try {
      existingFees = JSON.parse(savedFees);
    } catch (e) {
      console.error('Error parsing fees from localStorage:', e);
    }
  }
  
  // Generate IDs for new fees
  const newFees = fees.map(fee => ({
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    ...fee
  }));
  
  // Combine and save
  const updatedFees = [...existingFees, ...newFees];
  localStorage.setItem('fees', JSON.stringify(updatedFees));
  
  return { success: true, data: newFees };
};

export const exportFeesTemplate = (): Blob => {
  const headers = ['رقم الطالب', 'نوع الرسوم', 'المبلغ', 'الخصم', 'تاريخ الاستحقاق'];
  const csvContent = [
    headers.join(','),
    'S1001,tuition,1000,0,2023-09-01',
    'S1001,transportation,300,0,2023-09-01',
    'S1002,tuition,1000,100,2023-09-01',
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

// Installments API
export const getInstallments = async (schoolId?: string, studentId?: string, gradeLevel?: string | string[]): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get installments from localStorage
  let installments = [];
  const savedInstallments = localStorage.getItem('installments');
  if (savedInstallments) {
    try {
      installments = JSON.parse(savedInstallments);
    } catch (e) {
      console.error('Error parsing installments from localStorage:', e);
    }
  }
  
  // Apply filters
  let filteredInstallments = installments;
  
  if (schoolId) {
    filteredInstallments = filteredInstallments.filter((i: Installment) => i.schoolId === schoolId);
  }
  
  if (studentId) {
    filteredInstallments = filteredInstallments.filter((i: Installment) => i.studentId === studentId);
  }
  
  if (gradeLevel) {
    // Get students in the grade(s)
    let students = [];
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      try {
        students = JSON.parse(savedStudents);
      } catch (e) {
        console.error('Error parsing students from localStorage:', e);
      }
    }
    
    let studentIds = [];
    if (Array.isArray(gradeLevel)) {
      studentIds = students
        .filter((s: Student) => gradeLevel.includes(s.grade))
        .map((s: Student) => s.id);
    } else {
      studentIds = students
        .filter((s: Student) => s.grade === gradeLevel)
        .map((s: Student) => s.id);
    }
    
    filteredInstallments = filteredInstallments.filter((i: Installment) => studentIds.includes(i.studentId));
  }
  
  return { success: true, data: filteredInstallments };
};

// Create or update installment
export const saveInstallment = async (installmentData: any): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get existing installments
  let installments = [];
  const savedInstallments = localStorage.getItem('installments');
  if (savedInstallments) {
    try {
      installments = JSON.parse(savedInstallments);
    } catch (e) {
      console.error('Error parsing installments from localStorage:', e);
    }
  }
  
  let updatedInstallment;
  
  if (installmentData.id) {
    // Update existing installment
    const index = installments.findIndex((i: Installment) => i.id === installmentData.id);
    if (index === -1) {
      return { success: false, error: 'القسط غير موجود' };
    }
    
    updatedInstallment = { ...installments[index], ...installmentData };
    installments[index] = updatedInstallment;
  } else {
    // Create new installment
    const newId = String(Date.now());
    updatedInstallment = {
      id: newId,
      ...installmentData
    };
    installments.push(updatedInstallment);
  }
  
  // Update localStorage
  localStorage.setItem('installments', JSON.stringify(installments));
  
  return { success: true, data: updatedInstallment };
};

// WhatsApp Integration
export const sendWhatsAppMessage = async (phone: string, message: string): Promise<ApiResponse> => {
  try {
    await simulateDelay(600);
    
    // Save message to localStorage for history
    const savedMessages = localStorage.getItem('messages') || '[]';
    let messages = [];
    try {
      messages = JSON.parse(savedMessages);
    } catch (e) {
      console.error('Error parsing messages:', e);
    }
    
    const newMessage = {
      id: String(Date.now()),
      phone,
      message,
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };
    
    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    return { 
      success: true, 
      data: { id: `whatsapp_message_${Date.now()}` }
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { 
      success: false, 
      error: 'حدث خطأ أثناء إرسال رسالة الواتساب' 
    };
  }
};

// Settings API
export const getSchoolSettings = async (schoolId: string): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Try to get settings from localStorage
  const savedSettings = localStorage.getItem(`school_settings_${schoolId}`);
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      return { success: true, data: settings };
    } catch (e) {
      console.error('Error parsing settings from localStorage:', e);
    }
  }
  
  // School from database
  const school = mockDb.schools.find((s: School) => s.id === schoolId);
  
  // Default settings
  const defaultSettings = {
    name: school?.name || 'مدرسة جديدة',
    email: school?.email || 'info@school.edu.om',
    phone: school?.phone || '+968 24000000',
    address: school?.address || 'عنوان المدرسة، مسقط، عمان',
    logo: school?.logo || 'https://images.unsplash.com/photo-1466442929976-97f336a657be?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxPbWFuJTIwc2Nob29scyUyMGJ1aWxkaW5ncyUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NDU3MzkwMDB8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800',
    defaultInstallments: 4,
    tuitionFeeCategory: 'رسوم دراسية',
    transportationFeeOneWay: 150,
    transportationFeeTwoWay: 300
  };
  
  return { success: true, data: defaultSettings };
};

export const updateSchoolSettings = async (schoolId: string, settings: any): Promise<ApiResponse> => {
  console.log('updateSchoolSettings called with schoolId:', schoolId);
  console.log('settings to save:', settings);
  
  try {
    await simulateDelay();
    
    // Save settings to localStorage
    console.log('Saving settings to localStorage with key:', `school_settings_${schoolId}`);
    localStorage.setItem(`school_settings_${schoolId}`, JSON.stringify(settings));
    
    // Update school info in database if necessary
    const schoolIndex = mockDb.schools.findIndex((s: School) => s.id === schoolId);
    console.log('Found school index:', schoolIndex);
    
    if (schoolIndex !== -1) {
      console.log('Updating school in mockDb');
      mockDb.schools[schoolIndex] = {
        ...mockDb.schools[schoolIndex],
        name: settings.name,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        logo: settings.logo || mockDb.schools[schoolIndex].logo
      };
      
      // Update localStorage
      console.log('Updating schools in localStorage');
      localStorage.setItem('schools', JSON.stringify(mockDb.schools));
    } else {
      console.log('Creating new school in mockDb');
      // If school doesn't exist, create it
      const newSchool: School = {
        id: schoolId,
        name: settings.name,
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        location: '',
        active: true,
        subscriptionStart: new Date().toISOString().split('T')[0],
        subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        logo: settings.logo || ''
      };
      
      mockDb.schools.push(newSchool);
      console.log('Added new school to mockDb');
      localStorage.setItem('schools', JSON.stringify(mockDb.schools));
    }
    
    // Try to update in Appwrite if we're using it
    try {
      if (databases && SCHOOLS_COLLECTION_ID) {
        console.log('Attempting to update school in Appwrite');
        await databases.updateDocument(
          DATABASE_ID,
          SCHOOLS_COLLECTION_ID,
          schoolId,
          {
            name: settings.name,
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
            logo: settings.logo
          }
        );
        console.log('Successfully updated school in Appwrite');
      }
    } catch (appwriteError) {
      console.warn('Error updating school in Appwrite (continuing anyway):', appwriteError);
      // Continue even if Appwrite update fails - we've already updated localStorage
    }
    
    console.log('Settings saved successfully');
    return { success: true, data: settings };
  } catch (error) {
    console.error('Error in updateSchoolSettings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ الإعدادات'
    };
  }
};

// Accounts management
export const getAccounts = async (schoolId?: string): Promise<ApiResponse> => {
  try {
    console.log('Getting accounts with DATABASE_ID:', DATABASE_ID);
    console.log('Getting accounts with USERS_COLLECTION_ID:', USERS_COLLECTION_ID);
    
    let accounts: Array<{
      id: string;
      name: string;
      email: string;
      username: string;
      role: string;
      schoolId: string;
      school: string;
      gradeLevels: string[];
      createdAt: string;
      lastLogin: string | null;
    }> = [];
    
    // Check if we can fetch from Appwrite database
    if (DATABASE_ID && USERS_COLLECTION_ID) {
      try {
        // Try to get accounts from Appwrite
        console.log('Attempting to fetch accounts from Appwrite');
        const response = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [
            Query.orderDesc('createdAt')
          ]
        );

        console.log('Raw accounts data from Appwrite:', response);
        console.log(`Found ${response.documents.length} accounts in Appwrite`);

        // Map the documents to our account format
        accounts = response.documents.map((doc: any) => ({
          id: doc.$id,
          name: doc.name || '',
          email: doc.email || '',
          username: doc.username || doc.email || '',
          role: doc.role || 'schoolAdmin',
          schoolId: doc.schoolId || '',
          school: doc.schoolName || '',
          gradeLevels: doc.gradeLevels || [],
          createdAt: doc.createdAt || new Date().toISOString(),
          lastLogin: doc.lastLogin || null
        }));

        console.log('Processed accounts from Appwrite:', accounts);
        
        // Update localStorage with the latest from Appwrite
        localStorage.setItem('accounts', JSON.stringify(accounts));
        console.log('Updated localStorage with accounts from Appwrite');
      } catch (appwriteError) {
        console.error('Error fetching accounts from Appwrite, falling back to localStorage:', appwriteError);
        // Continue with localStorage fallback
      }
    }
    
    // If no accounts were found in Appwrite or there was an error, get from localStorage
    if (accounts.length === 0) {
      console.log('No accounts from Appwrite, checking localStorage');
      const localAccounts = localStorage.getItem('accounts');
      if (localAccounts) {
        try {
          accounts = JSON.parse(localAccounts);
          console.log('Accounts loaded from localStorage:', accounts);
        } catch (e) {
          console.error('Error parsing accounts from localStorage:', e);
        }
      }
    }

    // Filter by school if specified
    if (schoolId) {
      accounts = accounts.filter((account) => account.schoolId === schoolId);
      console.log(`Filtered accounts for school ${schoolId}:`, accounts);
    }

    // Try to sync accounts for future runs (don't await, do this in background)
    if (DATABASE_ID && USERS_COLLECTION_ID && accounts.length > 0) {
      syncAccountsWithAppwrite().catch(error => {
        console.error('Background sync error:', error);
      });
    }

    return { success: true, data: accounts };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    
    // Last resort: try to get from localStorage directly
    try {
      console.log('Attempting last resort localStorage fallback');
      const localAccounts = localStorage.getItem('accounts');
      if (localAccounts) {
        let accounts: Array<{
          id: string;
          name: string;
          email: string;
          username: string;
          role: string;
          schoolId: string;
          school?: string;
          gradeLevels?: string[];
          createdAt: string;
          lastLogin: string | null;
        }> = JSON.parse(localAccounts);
        if (schoolId) {
          accounts = accounts.filter((account) => account.schoolId === schoolId);
        }
        return { success: true, data: accounts };
      }
    } catch (localStorageError) {
      console.error('localStorage fallback also failed:', localStorageError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الحسابات'
    };
  }
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createAccount = async (
  email: string, 
  password: string, 
  name: string, 
  username: string,
  role: string = 'schoolAdmin',
  schoolId?: string,
  gradeLevels?: string[]
): Promise<ApiResponse> => {
  try {
    console.log('Creating account with following details:');
    console.log('- email:', email);
    console.log('- name:', name);
    console.log('- username:', username);
    console.log('- role:', role);
    console.log('- schoolId:', schoolId);
    console.log('- gradeLevels:', gradeLevels);
    console.log('- DATABASE_ID:', DATABASE_ID);
    console.log('- USERS_COLLECTION_ID:', USERS_COLLECTION_ID);

    // Check if a user with the same email already exists in localStorage or Appwrite
    try {
      // First check localStorage
      const localAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const existingLocalAccount = localAccounts.find((a: any) => 
        a.email.toLowerCase() === email.toLowerCase() || 
        (username && a.username && a.username.toLowerCase() === username.toLowerCase())
      );
      
      if (existingLocalAccount) {
        console.log('Account with this email/username already exists in localStorage:', existingLocalAccount);
        return {
          success: false,
          error: 'يوجد مستخدم بهذا البريد الإلكتروني أو اسم المستخدم بالفعل'
        };
      }

      // Then check Appwrite if configured
      if (DATABASE_ID && USERS_COLLECTION_ID) {
        try {
          const emailQuery = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal('email', email)]
          );
          
          if (emailQuery.documents.length > 0) {
            console.log('Account with this email already exists in Appwrite');
            return {
              success: false,
              error: 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل'
            };
          }
          
          if (username) {
            const usernameQuery = await databases.listDocuments(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              [Query.equal('username', username)]
            );
            
            if (usernameQuery.documents.length > 0) {
              console.log('Account with this username already exists in Appwrite');
              return {
                success: false,
                error: 'يوجد مستخدم بهذا اسم المستخدم بالفعل'
              };
            }
          }
        } catch (error) {
          console.error('Error checking existing users in Appwrite:', error);
          // Continue with account creation, assuming no duplicates
        }
      }
    } catch (checkError) {
      console.error('Error checking existing accounts:', checkError);
      // Continue with account creation
    }

    // Generate a unique ID for the user
    let uniqueId = ID.unique();
    
    // Get school name if schoolId is provided
    let schoolName = '';
    if (schoolId) {
      try {
        if (DATABASE_ID && SCHOOLS_COLLECTION_ID) {
          // Try to get the school from Appwrite first
          try {
            const schoolResponse = await databases.getDocument(
              DATABASE_ID,
              SCHOOLS_COLLECTION_ID,
              schoolId
            );
            schoolName = schoolResponse.name;
            console.log('School found in Appwrite:', schoolName);
          } catch (appwriteError) {
            console.warn('School not found in Appwrite, checking localStorage:', appwriteError);
            
            // If not found in Appwrite, try localStorage
            const localSchools = JSON.parse(localStorage.getItem('schools') || '[]');
            const localSchool = localSchools.find((s: School) => s.id === schoolId);
            
            if (localSchool) {
              schoolName = localSchool.name;
              console.log('School found in localStorage:', schoolName);
            } else {
              console.error('School not found in localStorage either');
              return { 
                success: false, 
                error: 'المدرسة المحددة غير موجودة. يرجى إنشاء المدرسة أولا ثم المحاولة مرة أخرى.' 
              };
            }
          }
        } else {
          // If Appwrite not configured, only check localStorage
          const localSchools = JSON.parse(localStorage.getItem('schools') || '[]');
          const localSchool = localSchools.find((s: School) => s.id === schoolId);
          
          if (localSchool) {
            schoolName = localSchool.name;
            console.log('School found in localStorage:', schoolName);
          } else {
            console.error('School not found in localStorage');
            return { 
              success: false, 
              error: 'المدرسة المحددة غير موجودة. يرجى إنشاء المدرسة أولا ثم المحاولة مرة أخرى.' 
            };
          }
        }
      } catch (error) {
        console.error('Error fetching school:', error);
        return { 
          success: false, 
          error: 'المدرسة المحددة غير موجودة. يرجى إنشاء المدرسة أولا ثم المحاولة مرة أخرى.' 
        };
      }
    }

    // Generate a unique email with timestamp to avoid conflicts in Appwrite auth
    const timestamp = Date.now().toString();
    let uniqueEmail = `${email.split('@')[0]}.${timestamp}@${email.split('@')[1]}`;
    console.log('Generated uniqueId:', uniqueId);
    console.log('Using uniqueEmail to avoid conflicts:', uniqueEmail);
    
    // Create the user document
    const userDoc = {
      name,
      full_name: name,
      email,
      username,
      role: role,
      schoolId: schoolId || '',
      schoolName: schoolName,
      gradeLevels: gradeLevels || [],
      createdAt: new Date().toISOString(),
      uniqueEmail,
      lastLogin: null
    };
    
    // Save to localStorage first
    const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const newLocalAccount = {
      id: uniqueId,
      ...userDoc
    };
    existingAccounts.push(newLocalAccount);
    localStorage.setItem('accounts', JSON.stringify(existingAccounts));
    console.log('User account saved to localStorage');
    
    // Try to create in Appwrite if configured
    let appwriteSuccess = false;
    if (DATABASE_ID && USERS_COLLECTION_ID) {
      try {
        // Check if this document ID already exists in Appwrite
        try {
          await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, uniqueId);
          // If it doesn't throw, the document exists - generate a new ID
          const newUniqueId = ID.unique() + '-' + Date.now().toString();
          console.log('Document ID already exists, using new ID:', newUniqueId);
          uniqueId = newUniqueId;
          
          // Update the localStorage entry with the new ID
          const updatedAccounts = existingAccounts.map((a: any) => {
            if (a.email === email) {
              return { ...a, id: uniqueId };
            }
            return a;
          });
          localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
        } catch (error) {
          // Document doesn't exist - this is good, we can proceed
          console.log('Document ID is available');
        }
        
        // Create document in database
        await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          uniqueId,
          userDoc
        );
        console.log('User document created successfully in Appwrite');
        appwriteSuccess = true;
        
        // Try to create auth user
        try {
          // Try up to 3 times with different unique emails if needed
          let authUserCreated = false;
          let maxAttempts = 3;
          let attempt = 0;
          
          while (attempt < maxAttempts && !authUserCreated) {
            attempt++;
            try {
              // Make the email more unique with each attempt
              if (attempt > 1) {
                uniqueEmail = `${email.split('@')[0]}.${timestamp}.${attempt}@${email.split('@')[1]}`;
                console.log(`Attempt ${attempt}: Using more unique email:`, uniqueEmail);
              }
              
              await account.create(uniqueId, uniqueEmail, password, name);
              console.log('Auth user created successfully with uniqueEmail');
              authUserCreated = true;
              
              // Update the document with the final unique email used
              if (uniqueEmail !== userDoc.uniqueEmail) {
                await databases.updateDocument(
                  DATABASE_ID,
                  USERS_COLLECTION_ID,
                  uniqueId,
                  { uniqueEmail }
                );
                console.log('Updated document with final uniqueEmail');
              }
            } catch (authError: any) {
              if (authError.code === 409 && attempt < maxAttempts) {
                console.warn(`Attempt ${attempt} failed due to duplicate, trying again with a more unique email`);
                await delay(100); // Short delay between retries
                continue;
              }
              throw authError; // Throw if it's not a 409 or we've reached max attempts
            }
          }
        } catch (authError: any) {
          console.error('Error creating auth user:', authError);
          // Document was created, but auth user failed - we'll continue anyway
          if (authError.code === 409) {
            console.warn('Auth user creation failed due to duplicate - document was created but auth user was not');
          }
        }
      } catch (dbError: any) {
        console.error('Error creating user document in Appwrite:', dbError);
        // This means the document creation in Appwrite failed, but we still have it in localStorage
      }
    }
    
    // Force a sync after creating to ensure consistency
    try {
      await syncAccountsWithAppwrite();
    } catch (syncError) {
      console.error('Error during post-creation sync:', syncError);
    }
    
    return { 
      success: true,
      message: appwriteSuccess 
        ? 'تم إنشاء الحساب بنجاح في Appwrite وفي التخزين المحلي' 
        : 'تم إنشاء الحساب في التخزين المحلي فقط'
    };
  } catch (error: any) {
    console.error('Error creating account:', error);
    
    return { 
      success: false, 
      error: error.message || 'Failed to create account'
    };
  }
};

export const getAccount = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      id
    );

    const account = {
      id: response.$id,
      name: response.name,
      email: response.email,
      username: response.username,
      role: response.role,
      schoolId: response.schoolId,
      gradeLevels: response.gradeLevels || [],
      createdAt: response.createdAt,
      lastLogin: response.lastLogin
    };

    return { success: true, data: account };
  } catch (error) {
    console.error('Error fetching account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء جلب الحساب'
    };
  }
};

export const updateAccount = async (id: string, accountData: any): Promise<ApiResponse> => {
  try {
    // Get school name if schoolId is provided
    let schoolName = accountData.schoolName;
    if (accountData.schoolId && !schoolName) {
      const schoolResponse = await databases.getDocument(
        DATABASE_ID,
        SCHOOLS_COLLECTION_ID,
        accountData.schoolId
      );
      schoolName = schoolResponse.name;
    }

    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      id,
      {
        name: accountData.name,
        email: accountData.email,
        username: accountData.username,
        role: accountData.role,
        schoolId: accountData.schoolId,
        schoolName: schoolName,
        gradeLevels: accountData.gradeLevels || [],
        lastLogin: accountData.lastLogin
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الحساب'
    };
  }
};

export const deleteAccount = async (id: string): Promise<ApiResponse> => {
  try {
    console.log('Attempting to delete account with ID:', id);
    
    // Check if Appwrite is configured
    if (DATABASE_ID && USERS_COLLECTION_ID) {
      try {
        // Try to delete the user document from Appwrite
        await databases.deleteDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          id
        );
        console.log('Account document deleted from Appwrite');
      } catch (error) {
        console.error('Error deleting account from Appwrite:', error);
        // Continue with localStorage deletion even if Appwrite deletion fails
      }
    }

    // Always update localStorage regardless of Appwrite result
    try {
      const localAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const updatedAccounts = localAccounts.filter((account: any) => account.id !== id);
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      console.log('Account removed from localStorage');
    } catch (localStorageError) {
      console.error('Error updating localStorage after account deletion:', localStorageError);
      // Continue - Appwrite deletion might have succeeded
    }
    
    // Try to get updated accounts from Appwrite to keep localStorage in sync
    if (DATABASE_ID && USERS_COLLECTION_ID) {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID
        );

        const accounts = response.documents.map((doc: any) => ({
          id: doc.$id,
          name: doc.name || '',
          email: doc.email || '',
          username: doc.username || doc.email || '',
          role: doc.role || 'schoolAdmin',
          schoolId: doc.schoolId || '',
          school: doc.schoolName || '',
          gradeLevels: doc.gradeLevels || [],
          createdAt: doc.createdAt || new Date().toISOString(),
          lastLogin: doc.lastLogin || null
        }));

        localStorage.setItem('accounts', JSON.stringify(accounts));
        console.log('Synchronized accounts from Appwrite to localStorage');
      } catch (syncError) {
        console.error('Error syncing accounts after deletion:', syncError);
        // The deletion already happened, so we can ignore this error
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in account deletion process:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الحساب'
    };
  }
};

// Get all stored messages
export const getMessages = async (schoolId?: string): Promise<ApiResponse> => {
  await simulateDelay();
  
  // Get messages from localStorage
  let messages = [];
  const savedMessages = localStorage.getItem('messages');
  if (savedMessages) {
    try {
      messages = JSON.parse(savedMessages);
      
      if (schoolId) {
        messages = messages.filter((m: Message) => m.schoolId === schoolId);
      }
    } catch (e) {
      console.error('Error parsing messages from localStorage:', e);
    }
  }
  
  return { success: true, data: messages };
};

export const cleanupDatabase = async (): Promise<ApiResponse> => {
  try {
    // Get all users from Users collection
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID
    );

    // Delete all users except admin
    for (const user of usersResponse.documents) {
      if (user.email !== ADMIN_EMAIL) {
        try {
          // Delete from Users collection
          await databases.deleteDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            user.id
          );
        } catch (error) {
          console.error(`Error deleting user ${user.id} from collection:`, error);
        }
      }
    }

    // Get all schools
    const schoolsResponse = await databases.listDocuments(
      DATABASE_ID,
      SCHOOLS_COLLECTION_ID
    );

    // Delete all schools
    for (const school of schoolsResponse.documents) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          SCHOOLS_COLLECTION_ID,
          school.id
        );
      } catch (error) {
        console.error(`Error deleting school ${school.id}:`, error);
      }
    }

    return { 
      success: true, 
      data: { 
        message: 'Database cleaned up successfully',
        deletedUsers: usersResponse.documents.length - 1, // Subtract 1 for admin
        deletedSchools: schoolsResponse.documents.length
      }
    };
  } catch (error) {
    console.error('Error cleaning up database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء تنظيف قاعدة البيانات'
    };
  }
};

// Utility function to synchronize accounts between Appwrite and localStorage
export const syncAccountsWithAppwrite = async (): Promise<boolean> => {
  console.log('Attempting to synchronize accounts with Appwrite...');
  
  if (!DATABASE_ID || !USERS_COLLECTION_ID) {
    console.log('Appwrite not properly configured, skipping synchronization');
    return false;
  }
  
  try {
    // Get accounts from Appwrite
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.orderDesc('createdAt')]
    );
    
    console.log('Found', response.documents.length, 'accounts in Appwrite');
    
    // Get accounts from localStorage
    const localAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    console.log('Found', localAccounts.length, 'accounts in localStorage');
    
    // Process Appwrite accounts
    const appwriteAccounts = response.documents.map((doc: any) => ({
      id: doc.$id,
      name: doc.name || '',
      email: doc.email || '',
      username: doc.username || doc.email || '',
      role: doc.role || 'schoolAdmin',
      schoolId: doc.schoolId || '',
      school: doc.schoolName || '',
      gradeLevels: doc.gradeLevels || [],
      createdAt: doc.createdAt || new Date().toISOString(),
      lastLogin: doc.lastLogin || null
    }));
    
    // Find accounts in localStorage that don't exist in Appwrite
    const appwriteIds = appwriteAccounts.map(a => a.id);
    const localOnlyAccounts = localAccounts.filter((a: any) => !appwriteIds.includes(a.id));
    
    console.log(`Found ${localOnlyAccounts.length} accounts in localStorage that don't exist in Appwrite`);
    
    // If there are local-only accounts, try to create them in Appwrite
    if (localOnlyAccounts.length > 0) {      
      for (const localAccount of localOnlyAccounts) {
        try {
          // Skip if there's no proper email or it's not a string (corrupt data)
          if (!localAccount.email || typeof localAccount.email !== 'string') {
            console.log('Skipping invalid account without proper email:', localAccount);
            continue;
          }
          
          // Check if user with this email already exists
          const emailCheck = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal('email', localAccount.email)]
          );
          
          if (emailCheck.documents.length > 0) {
            console.log(`Account with email ${localAccount.email} already exists in Appwrite with different ID`);
            continue;
          }
          
          // Create document in Appwrite
          console.log(`Creating document in Appwrite for account ${localAccount.email} with ID ${localAccount.id}`);
          await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            localAccount.id,
            {
              name: localAccount.name || '',
              full_name: localAccount.name || '', // Make sure full_name is included
              email: localAccount.email,
              username: localAccount.username || localAccount.email,
              role: localAccount.role || 'schoolAdmin',
              schoolId: localAccount.schoolId || '',
              schoolName: localAccount.school || '',
              gradeLevels: localAccount.gradeLevels || [],
              createdAt: localAccount.createdAt || new Date().toISOString(),
              lastLogin: localAccount.lastLogin || null
            }
          );
          console.log(`Created account for ${localAccount.email} in Appwrite`);
        } catch (error) {
          console.error(`Error creating local account ${localAccount.id} in Appwrite:`, error);
        }
      }
      
      // Refresh the Appwrite accounts list after creating the missing accounts
      try {
        const updatedResponse = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.orderDesc('createdAt')]
        );
        
        const updatedAppwriteAccounts = updatedResponse.documents.map((doc: any) => ({
          id: doc.$id,
          name: doc.name || '',
          email: doc.email || '',
          username: doc.username || doc.email || '',
          role: doc.role || 'schoolAdmin',
          schoolId: doc.schoolId || '',
          school: doc.schoolName || '',
          gradeLevels: doc.gradeLevels || [],
          createdAt: doc.createdAt || new Date().toISOString(),
          lastLogin: doc.lastLogin || null
        }));
        
        // Update localStorage with the final merged list
        localStorage.setItem('accounts', JSON.stringify(updatedAppwriteAccounts));
        console.log('Updated localStorage with synchronized accounts');
      } catch (refreshError) {
        console.error('Error refreshing accounts after sync:', refreshError);
      }
    } else {
      // If no local-only accounts, just update localStorage with Appwrite accounts
      localStorage.setItem('accounts', JSON.stringify(appwriteAccounts));
      console.log('Updated localStorage with Appwrite accounts');
    }
    
    return true;
  } catch (error) {
    console.error('Error synchronizing accounts with Appwrite:', error);
    return false;
  }
};

export default {
  getSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
  getStudents,
  createStudent,
  importStudents,
  exportStudentsTemplate,
  getFees,
  createFee,
  importFees,
  exportFeesTemplate,
  getInstallments,
  saveInstallment,
  sendWhatsAppMessage,
  getSchoolSettings,
  updateSchoolSettings,
  getAccounts,
  createAccount,
  getAccount,
  updateAccount,
  deleteAccount,
  getMessages,
  cleanupDatabase,
  syncAccountsWithAppwrite
};
 