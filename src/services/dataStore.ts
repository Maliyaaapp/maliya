import  { GRADE_LEVELS, DEFAULT_SCHOOL_IMAGES } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
export interface School {
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

export interface Account {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: 'admin' | 'schoolAdmin' | 'gradeManager';
  schoolId: string;
  schoolName?: string;
  schoolLogo?: string;
  gradeLevels?: string[];
  lastLogin?: string | null;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  parentName: string;
  parentEmail?: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  transportation: 'none' | 'one-way' | 'two-way';
  transportationDirection?: 'to-school' | 'from-school';
  transportationFee?: number;
  customTransportationFee?: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  feeType: string;
  description?: string;
  amount: number;
  discount: number;
  paid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  dueDate: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  transportationType?: 'one-way' | 'two-way';
}

export interface Installment {
  id: string;
  feeId: string;
  studentId: string;
  studentName: string;
  grade: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'paid' | 'upcoming' | 'overdue';
  note?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  feeType: string;
}

export interface Message {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  parentName: string;
  phone: string;
  template: string;
  message: string;
  sentAt: string;
  status: 'delivered' | 'failed' | 'pending';
  schoolId: string;
}

export interface Settings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  defaultInstallments: number;
  tuitionFeeCategory: string;
  transportationFeeOneWay: number;
  transportationFeeTwoWay: number;
}

// Type for event handlers
type Listener = () => void;

// DataStore singleton
class DataStore {
  private listeners: Listener[] = [];
  private initialized = false;

  // Initialize the store with default data if not already present in localStorage
  initialize(): void {
    if (this.initialized) return;

    try {
      // Helper functions for safely accessing localStorage
      const safeGetItem = <T>(key: string, defaultValue: T): T => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
          console.warn(`Error retrieving ${key} from localStorage:`, error);
          return defaultValue;
        }
      };

      const safeSetItem = (key: string, value: any): boolean => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          console.warn(`Error saving ${key} to localStorage:`, error);
          return false;
        }
      };

      // Check schools
      if (!localStorage.getItem('schools')) {
        safeSetItem('schools', this.getDefaultSchools());
      }

      // Check if accounts exist, if not add default accounts
      const savedAccounts = safeGetItem('accounts', []);
      if (!savedAccounts || savedAccounts.length === 0) {
        const defaultAccounts = this.getDefaultAccounts();
        safeSetItem('accounts', defaultAccounts);
      }

      // Initialize an empty students array if it doesn't exist
      if (!localStorage.getItem('students')) {
        safeSetItem('students', []);
      }

      // Initialize an empty fees array if it doesn't exist
      if (!localStorage.getItem('fees')) {
        safeSetItem('fees', []);
      }

      // Initialize an empty installments array if it doesn't exist
      if (!localStorage.getItem('installments')) {
        safeSetItem('installments', []);
      }

      // Initialize an empty messages array if it doesn't exist
      if (!localStorage.getItem('messages')) {
        safeSetItem('messages', []);
      }
    } catch (error) {
      console.error('Error initializing data store:', error);
      // Continue even if initialization fails
    }

    // Set initialized flag
    this.initialized = true;
  }

  // Default data generators
  private getDefaultSchools(): School[] {
    return [];
  }

  private getDefaultAccounts(): Account[] {
    return [];
  }

  // Event subscription
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all subscribers - make it public for direct triggering
  notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Schools
  getSchools(): School[] {
    try {
      const schools = localStorage.getItem('schools');
      return schools ? JSON.parse(schools) : [];
    } catch (e) {
      console.error('Error loading schools:', e);
      return [];
    }
  }

  getSchool(id: string): School | null {
    const schools = this.getSchools();
    return schools.find(s => s.id === id) || null;
  }

  saveSchool(school: School): School {
    const schools = this.getSchools();
    const isNew = !school.id;
    
    if (isNew) {
      // Create new school
      const newSchool = {
        ...school,
        id: uuidv4()
      };
      schools.push(newSchool);
    } else {
      // Update existing school
      const index = schools.findIndex(s => s.id === school.id);
      if (index >= 0) {
        schools[index] = school;
      } else {
        throw new Error('School not found');
      }
    }
    
    localStorage.setItem('schools', JSON.stringify(schools));
    this.notifyListeners();
    return isNew ? schools[schools.length - 1] : school;
  }

  deleteSchool(id: string): void {
    const schools = this.getSchools();
    const updatedSchools = schools.filter(s => s.id !== id);
    localStorage.setItem('schools', JSON.stringify(updatedSchools));
    this.notifyListeners();
  }

  // Accounts
  getAccounts(schoolId?: string): Account[] {
    try {
      const accounts = localStorage.getItem('accounts');
      const parsed = accounts ? JSON.parse(accounts) : [];
      
      if (schoolId) {
        return parsed.filter((a: Account) => a.schoolId === schoolId);
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading accounts:', e);
      return [];
    }
  }

  getAccount(id: string): Account | null {
    const accounts = this.getAccounts();
    return accounts.find(a => a.id === id) || null;
  }

  saveAccount(account: Account): Account {
    const accounts = this.getAccounts();
    const isNew = !account.id;
    
    // Add school information if available
    if (account.schoolId) {
      const school = this.getSchool(account.schoolId);
      if (school) {
        account.schoolName = school.name;
        account.schoolLogo = school.logo;
      }
    }
    
    if (isNew) {
      // Create new account
      const newAccount = {
        ...account,
        id: uuidv4(),
        lastLogin: account.lastLogin || null
      };
      accounts.push(newAccount);
    } else {
      // Update existing account
      const index = accounts.findIndex(a => a.id === account.id);
      if (index >= 0) {
        // Keep the password if not provided
        if (!account.password && accounts[index].password) {
          account.password = accounts[index].password;
        }
        accounts[index] = account;
      } else {
        throw new Error('Account not found');
      }
    }
    
    localStorage.setItem('accounts', JSON.stringify(accounts));
    this.notifyListeners();
    return isNew ? accounts[accounts.length - 1] : account;
  }

  deleteAccount(id: string): void {
    const accounts = this.getAccounts();
    const updatedAccounts = accounts.filter(a => a.id !== id);
    localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
    this.notifyListeners();
  }

  // Students
  getStudents(schoolId?: string, grades?: string | string[]): Student[] {
    try {
      const students = localStorage.getItem('students');
      let parsed = students ? JSON.parse(students) : [];
      
      if (schoolId) {
        parsed = parsed.filter((s: Student) => s.schoolId === schoolId);
      }
      
      if (grades) {
        if (Array.isArray(grades)) {
          parsed = parsed.filter((s: Student) => grades.includes(s.grade));
        } else {
          parsed = parsed.filter((s: Student) => s.grade === grades);
        }
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading students:', e);
      return [];
    }
  }

  getStudent(id: string): Student | null {
    try {
      const students = localStorage.getItem('students');
      const parsed = students ? JSON.parse(students) : [];
      return parsed.find((s: Student) => s.id === id) || null;
    } catch (e) {
      console.error('Error getting student:', e);
      return null;
    }
  }

  saveStudent(student: Partial<Student>): Student {
    try {
      const students = this.getStudents();
      const now = new Date().toISOString();
      const isNew = !student.id;
      
      if (isNew) {
        // Create new student
        const newStudent = {
          ...student,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        } as Student;
        students.push(newStudent);
        
        localStorage.setItem('students', JSON.stringify(students));
        this.notifyListeners();
        return newStudent;
      } else {
        // Update existing student
        const index = students.findIndex(s => s.id === student.id);
        if (index >= 0) {
          students[index] = {
            ...students[index],
            ...student,
            updatedAt: now
          };
          
          localStorage.setItem('students', JSON.stringify(students));
          this.notifyListeners();
          return students[index];
        } else {
          throw new Error('Student not found');
        }
      }
    } catch (error) {
      console.error('Error in saveStudent:', error);
      throw error;
    }
  }

  deleteStudent(id: string): void {
    const students = this.getStudents();
    const updatedStudents = students.filter(s => s.id !== id);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    this.notifyListeners();
  }

  // Generate a student ID based on grade and school
  generateStudentId(schoolId: string, grade: string): string {
    const gradeCode = grade ? grade.charAt(0) + grade.charAt(grade.length - 1) : "XX";
    const schoolCode = schoolId.substring(0, 2);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${schoolCode}${gradeCode}${randomNum}`;
  }

  // Fees
  getFees(schoolId?: string, studentId?: string, grades?: string | string[]): Fee[] {
    try {
      const fees = localStorage.getItem('fees');
      let parsed = fees ? JSON.parse(fees) : [];
      
      if (schoolId) {
        parsed = parsed.filter((f: Fee) => f.schoolId === schoolId);
      }
      
      if (studentId) {
        parsed = parsed.filter((f: Fee) => f.studentId === studentId);
      }
      
      if (grades) {
        if (Array.isArray(grades)) {
          parsed = parsed.filter((f: Fee) => grades.includes(f.grade));
        } else {
          parsed = parsed.filter((f: Fee) => f.grade === grades);
        }
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading fees:', e);
      return [];
    }
  }

  getFee(id: string): Fee | null {
    try {
      const fees = localStorage.getItem('fees');
      const parsed = fees ? JSON.parse(fees) : [];
      return parsed.find((f: Fee) => f.id === id) || null;
    } catch (e) {
      console.error('Error getting fee:', e);
      return null;
    }
  }

  saveFee(fee: Partial<Fee>): Fee {
    const fees = this.getFees();
    const now = new Date().toISOString();
    const isNew = !fee.id;
    
    // Ensure required fields
    const amount = fee.amount || 0;
    const discount = fee.discount || 0;
    const paid = fee.paid || 0;
    const balance = amount - discount - paid;
    
    // Determine status
    let status: 'paid' | 'partial' | 'unpaid';
    if (balance <= 0) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }
    
    if (isNew) {
      // Get student details for the new fee
      const student = this.getStudent(fee.studentId!);
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Create new fee
      const newFee = {
        ...fee,
        id: uuidv4(),
        studentName: student.name,
        grade: student.grade,
        amount,
        discount,
        paid: paid || 0,
        balance,
        status,
        createdAt: now,
        updatedAt: now
      } as Fee;
      fees.push(newFee);
    } else {
      // Update existing fee
      const index = fees.findIndex(f => f.id === fee.id);
      if (index >= 0) {
        fees[index] = {
          ...fees[index],
          ...fee,
          amount,
          discount,
          paid: fee.paid || fees[index].paid,
          balance,
          status,
          updatedAt: now
        };
      } else {
        throw new Error('Fee not found');
      }
    }
    
    localStorage.setItem('fees', JSON.stringify(fees));
    this.notifyListeners();
    return isNew ? fees[fees.length - 1] : fees.find(f => f.id === fee.id)!;
  }

  deleteFee(id: string): void {
    const fees = this.getFees();
    const updatedFees = fees.filter(f => f.id !== id);
    localStorage.setItem('fees', JSON.stringify(updatedFees));
    this.notifyListeners();
  }

  // Installments
  getInstallments(schoolId?: string, studentId?: string, feeId?: string, grades?: string | string[]): Installment[] {
    try {
      const installments = localStorage.getItem('installments');
      let parsed = installments ? JSON.parse(installments) : [];
      
      if (schoolId) {
        parsed = parsed.filter((i: Installment) => i.schoolId === schoolId);
      }
      
      if (studentId) {
        parsed = parsed.filter((i: Installment) => i.studentId === studentId);
      }
      
      if (feeId) {
        parsed = parsed.filter((i: Installment) => i.feeId === feeId);
      }
      
      if (grades) {
        if (Array.isArray(grades)) {
          parsed = parsed.filter((i: Installment) => grades.includes(i.grade));
        } else {
          parsed = parsed.filter((i: Installment) => i.grade === grades);
        }
      }
      
      // Update status based on current date
      parsed = parsed.map((installment: Installment) => {
        if (installment.paidDate) {
          return { ...installment, status: 'paid' };
        }
        
        const dueDate = new Date(installment.dueDate);
        const today = new Date();
        
        if (dueDate < today) {
          return { ...installment, status: 'overdue' };
        }
        
        return { ...installment, status: 'upcoming' };
      });
      
      return parsed;
    } catch (e) {
      console.error('Error loading installments:', e);
      return [];
    }
  }

  getInstallment(id: string): Installment | null {
    try {
      const installments = localStorage.getItem('installments');
      const parsed = installments ? JSON.parse(installments) : [];
      const installment = parsed.find((i: Installment) => i.id === id) || null;
      
      // Update status based on current date
      if (installment) {
        if (installment.paidDate) {
          installment.status = 'paid';
        } else {
          const dueDate = new Date(installment.dueDate);
          const today = new Date();
          
          if (dueDate < today) {
            installment.status = 'overdue';
          } else {
            installment.status = 'upcoming';
          }
        }
      }
      
      return installment;
    } catch (e) {
      console.error('Error getting installment:', e);
      return null;
    }
  }

  saveInstallment(installment: Partial<Installment>): Installment {
    const installments = this.getInstallments();
    const now = new Date().toISOString();
    const isNew = !installment.id;
    
    // Determine status
    let status: 'paid' | 'upcoming' | 'overdue';
    if (installment.paidDate) {
      status = 'paid';
    } else {
      const dueDate = new Date(installment.dueDate!);
      const today = new Date();
      
      if (dueDate < today) {
        status = 'overdue';
      } else {
        status = 'upcoming';
      }
    }
    
    if (isNew) {
      // Get student details if needed
      let studentName = installment.studentName;
      let grade = installment.grade;
      
      if (!studentName || !grade) {
        const student = this.getStudent(installment.studentId!);
        if (student) {
          studentName = student.name;
          grade = student.grade;
        }
      }
      
      // Create new installment
      const newInstallment = {
        ...installment,
        id: uuidv4(),
        studentName,
        grade,
        status,
        createdAt: now,
        updatedAt: now
      } as Installment;
      installments.push(newInstallment);
    } else {
      // Update existing installment
      const index = installments.findIndex(i => i.id === installment.id);
      if (index >= 0) {
        installments[index] = {
          ...installments[index],
          ...installment,
          status,
          updatedAt: now
        };
      } else {
        throw new Error('Installment not found');
      }
    }
    
    localStorage.setItem('installments', JSON.stringify(installments));
    this.notifyListeners();
    return isNew ? installments[installments.length - 1] : installments.find(i => i.id === installment.id)!;
  }

  deleteInstallment(id: string): void {
    const installments = this.getInstallments();
    const updatedInstallments = installments.filter(i => i.id !== id);
    localStorage.setItem('installments', JSON.stringify(updatedInstallments));
    this.notifyListeners();
  }

  // Create installment plan from a fee
  createInstallmentPlan(fee: Fee, count: number, interval: number = 1): Installment[] {
    if (count <= 0) return [];
    
    const installments: Installment[] = [];
    const amount = Math.floor((fee.amount - fee.discount) / count);
    const remainder = (fee.amount - fee.discount) % count;
    
    // Calculate first installment date
    const startDate = new Date(fee.dueDate);
    
    for (let i = 0; i < count; i++) {
      // Calculate installment amount (add remainder to first installment)
      const installmentAmount = i === 0 ? amount + remainder : amount;
      
      // Calculate due date (first installment is on fee due date, others are monthly)
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i * interval);
      
      // Create installment
      const installment: Partial<Installment> = {
        feeId: fee.id,
        studentId: fee.studentId,
        studentName: fee.studentName,
        grade: fee.grade,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        paidDate: null,
        status: 'upcoming',
        schoolId: fee.schoolId,
        feeType: fee.feeType,
        note: `القسط ${i + 1} من ${count} - ${fee.description || this.getFeeTypeLabel(fee.feeType)}`
      };
      
      // Save installment
      const savedInstallment = this.saveInstallment(installment);
      installments.push(savedInstallment);
    }
    
    return installments;
  }

  // Messages
  getMessages(schoolId?: string, studentId?: string): Message[] {
    try {
      const messages = localStorage.getItem('messages');
      let parsed = messages ? JSON.parse(messages) : [];
      
      if (schoolId) {
        parsed = parsed.filter((m: Message) => m.schoolId === schoolId);
      }
      
      if (studentId) {
        parsed = parsed.filter((m: Message) => m.studentId === studentId);
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading messages:', e);
      return [];
    }
  }

  saveMessage(message: Partial<Message>): Message {
    const messages = this.getMessages();
    const isNew = !message.id;
    
    if (isNew) {
      // Create new message
      const newMessage = {
        ...message,
        id: uuidv4(),
        sentAt: message.sentAt || new Date().toISOString()
      } as Message;
      messages.push(newMessage);
    } else {
      // Update existing message
      const index = messages.findIndex(m => m.id === message.id);
      if (index >= 0) {
        messages[index] = {
          ...messages[index],
          ...message
        };
      } else {
        throw new Error('Message not found');
      }
    }
    
    localStorage.setItem('messages', JSON.stringify(messages));
    this.notifyListeners();
    return isNew ? messages[messages.length - 1] : messages.find(m => m.id === message.id)!;
  }

  deleteMessage(id: string): void {
    const messages = this.getMessages();
    const updatedMessages = messages.filter(m => m.id !== id);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
    this.notifyListeners();
  }

  // Settings
  getSettings(schoolId: string): Settings {
    try {
      const settingsKey = `school_settings_${schoolId}`;
      const savedSettings = localStorage.getItem(settingsKey);
      
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
      
      // Default settings
      const school = this.getSchool(schoolId);
      const defaultSettings: Settings = {
        name: school?.name || 'المدرسة',
        email: school?.email || '',
        phone: school?.phone || '',
        address: school?.address || '',
        logo: school?.logo || '',
        defaultInstallments: 4,
        tuitionFeeCategory: 'رسوم دراسية',
        transportationFeeOneWay: 150,
        transportationFeeTwoWay: 300
      };
      
      try {
        localStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
      } catch (storageError) {
        console.warn('Unable to save settings to localStorage:', storageError);
        // Continue without saving to localStorage
      }
      
      return defaultSettings;
    } catch (e) {
      console.error('Error getting settings:', e);
      return {
        name: 'المدرسة',
        email: '',
        phone: '',
        address: '',
        logo: '',
        defaultInstallments: 4,
        tuitionFeeCategory: 'رسوم دراسية',
        transportationFeeOneWay: 150,
        transportationFeeTwoWay: 300
      };
    }
  }

  saveSettings(schoolId: string, settings: Settings): Settings {
    try {
      const settingsKey = `school_settings_${schoolId}`;
      try {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      } catch (storageError) {
        console.warn('Unable to save settings to localStorage:', storageError);
        // Continue without saving to localStorage
      }
      
      this.notifyListeners();
      return settings;
    } catch (e) {
      console.error('Error saving settings:', e);
      throw e;
    }
  }

  // Helper function to get fee type label
  getFeeTypeLabel(type: string): string {
    const feeTypes: Record<string, string> = {
      'tuition': 'رسوم دراسية',
      'transportation': 'نقل مدرسي',
      'activities': 'أنشطة',
      'uniform': 'زي مدرسي',
      'books': 'كتب',
      'other': 'رسوم أخرى'
    };
    
    return feeTypes[type] || type;
  }

  // Reset all data
  resetData(): void {
    try {
      // Clear all localStorage data
      localStorage.removeItem('schools');
      localStorage.removeItem('accounts');
      localStorage.removeItem('students');
      localStorage.removeItem('fees');
      localStorage.removeItem('installments');
      localStorage.removeItem('messages');
      
      // Clear all school settings
      const schools = this.getSchools();
      schools.forEach(school => {
        localStorage.removeItem(`school_settings_${school.id}`);
      });
      
      // Try to clean up Appwrite data if the API is available
      import('../services/api').then(api => {
        try {
          // Attempt to call the cleanupDatabase function
          api.default.cleanupDatabase().then(response => {
            console.log('Appwrite cleanup response:', response);
          }).catch(error => {
            console.warn('Failed to clean up Appwrite database:', error);
          });
        } catch (apiError) {
          console.warn('Could not clean up Appwrite database:', apiError);
        }
      }).catch(importError => {
        console.warn('Could not import API module for cleanup:', importError);
      });
      
      // Reinitialize with empty data
      localStorage.setItem('schools', JSON.stringify([]));
      localStorage.setItem('accounts', JSON.stringify([]));
      localStorage.setItem('students', JSON.stringify([]));
      localStorage.setItem('fees', JSON.stringify([]));
      localStorage.setItem('installments', JSON.stringify([]));
      localStorage.setItem('messages', JSON.stringify([]));
      
      console.log('All data has been reset');
      this.notifyListeners();
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  }
}

// Create and initialize singleton instance
const dataStore = new DataStore();
dataStore.initialize();

// Export the reset method directly
export const resetAllData = () => dataStore.resetData();

export default dataStore;
 