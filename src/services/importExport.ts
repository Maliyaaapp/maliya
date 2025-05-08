import  { GRADE_LEVELS, TRANSPORTATION_TYPES } from '../utils/constants';
import dataStore from './dataStore';

// Define interfaces for imported data
interface ImportedStudent {
  name: string;
  studentId: string;
  grade: string;
  parentName: string;
  phone: string;
  transportation: 'none' | 'one-way' | 'two-way';
  transportationDirection?: 'to-school' | 'from-school';
  transportationFee?: number;
  customTransportationFee?: boolean;
  tuitionFee?: number;
  tuitionDiscount?: number;
}

interface  ImportedFee {
  studentId: string;
  feeType: string;
  amount: number;
  discount?: number;
  discountPercentage?: number;
  dueDate?: string;
} 

// Function to parse CSV files with proper Arabic support
export const parseCSV = (text: string): Array<any> => {
  // Make sure we have the BOM prefix for UTF-8
  const BOM = "\uFEFF";
  let content = text;
  if (!text.startsWith(BOM)) {
    content = BOM + text;
  }
  
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  
  // Process headers - clean up and normalize
  const headers = lines[0].replace(BOM, '').split(',').map(h => h.trim());
  
   // Map Arabic headers to English properties
  const headerMap: Record<string, string> = {
    // Student headers
    'اسم الطالب': 'name',
    'رقم الطالب': 'studentId',
    'الصف': 'grade',
    'اسم ولي الأمر': 'parentName',
    'رقم الهاتف': 'phone',
    'النقل': 'transportation',
    'اتجاه النقل': 'transportationDirection',
    'رسوم النقل': 'transportationFee',
    
    // Fee headers
    'نوع الرسوم': 'feeType',
    'المبلغ': 'amount',
    'الخصم': 'discount',
    'نسبة الخصم %': 'discountPercentage',
    'تاريخ الاستحقاق': 'dueDate',
    
    // Additional headers for direct tuition fee input
    'الرسوم الدراسية': 'tuitionFee',
    'خصم الرسوم الدراسية': 'tuitionDiscount',
    'نسبة الخصم': 'discountPercentage',
    'نسبة خصم الرسوم': 'tuitionDiscountPercentage'
  }; 
  
  // Normalize headers
  const normalizedHeaders = headers.map(header => headerMap[header] || header);
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const entry: any = {};
    
    normalizedHeaders.forEach((header, index) => {
      if (index < values.length) {
        entry[header] = values[index];
      }
    });
    
    result.push(entry);
  }
  
  return result;
};

// Function to convert Excel file to CSV using SheetJS (client-side)
export const excelToCSV = async (file: File): Promise<string> => {
  // In a real implementation we would use SheetJS or a server-side approach
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsText(file, 'UTF-8');
  });
};

// Process imported students data
export const processImportedStudents = (
  data: Array<any>, 
  schoolId: string, 
  settings: any
): { students: ImportedStudent[], fees: ImportedFee[] } => {
  const students: ImportedStudent[] = [];
  const fees: ImportedFee[] = [];
  
  data.forEach(row => {
    // Skip completely empty rows
    if (!row.name && !row.studentId) return;
    
    // For students import, we must have at least a name
    if (row.name) {
      // Generate default student ID if not provided
      const studentId = row.studentId || `S${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Parse transportation field
      let transportation: 'none' | 'one-way' | 'two-way' = 'none';
      let transportationDirection: 'to-school' | 'from-school' | undefined = undefined;
      
      // Check if transportation field exists
      if (row.transportation) {
        const transportValue = String(row.transportation).toLowerCase();
        
        // Handle Arabic transportation values
        if (transportValue.includes('اتجاهين') || transportValue === 'two-way') {
          transportation = 'two-way';
        } else if (
          transportValue.includes('اتجاه واحد') || 
          transportValue === 'one-way' ||
          transportValue.includes('اتجاه')
        ) {
          transportation = 'one-way';
          
          // Check for direction in transportation field
          if (
            transportValue.includes('إلى المدرسة') || 
            transportValue.includes('الى المدرسة') || 
            transportValue.includes('to-school')
          ) {
            transportationDirection = 'to-school';
          } else if (
            transportValue.includes('من المدرسة') || 
            transportValue.includes('from-school')
          ) {
            transportationDirection = 'from-school';
          }
        }
      }
      
      // Parse transportation direction if provided separately
      if (row.transportationDirection) {
        const directionValue = String(row.transportationDirection).toLowerCase();
        
        if (
          directionValue.includes('إلى المدرسة') || 
          directionValue.includes('الى المدرسة') || 
          directionValue === 'to-school'
        ) {
          transportationDirection = 'to-school';
        } else if (
          directionValue.includes('من المدرسة') || 
          directionValue === 'from-school'
        ) {
          transportationDirection = 'from-school';
        }
      }
      
      // Parse transportation fee if provided
      let transportationFee: number | undefined = undefined;
      let customTransportationFee = false;
      
      if (row.transportationFee) {
        transportationFee = parseFloat(row.transportationFee);
        if (!isNaN(transportationFee) && transportationFee > 0) {
          customTransportationFee = true;
        }
      }
      
      // If no custom fee provided, use default from settings
      if (transportation !== 'none' && !customTransportationFee) {
        transportationFee = transportation === 'one-way' 
          ? settings.transportationFeeOneWay 
          : settings.transportationFeeTwoWay;
      }
      
           // Parse tuition fee and discount if provided directly
      let tuitionFee: number | undefined = undefined;
      let tuitionDiscount: number | undefined = undefined;
      let tuitionDiscountPercentage: number | undefined = undefined;
      
      if (row.tuitionFee) {
        tuitionFee = parseFloat(row.tuitionFee);
        if (isNaN(tuitionFee)) tuitionFee = undefined;
      } else if (row.amount && (!row.feeType || row.feeType === 'tuition')) {
        // Fall back to amount field if tuitionFee not explicitly provided
        tuitionFee = parseFloat(row.amount);
        if (isNaN(tuitionFee)) tuitionFee = undefined;
      }
      
      // Handle discount - could be direct value or percentage
      if (row.tuitionDiscount) {
        tuitionDiscount = parseFloat(row.tuitionDiscount);
        if (isNaN(tuitionDiscount)) tuitionDiscount = undefined;
      } else if (row.discount && (!row.feeType || row.feeType === 'tuition')) {
        // Fall back to discount field if tuitionDiscount not explicitly provided
        tuitionDiscount = parseFloat(row.discount);
        if (isNaN(tuitionDiscount)) tuitionDiscount = undefined;
      }
      
      // Check for discount percentage
      if (row.tuitionDiscountPercentage) {
        tuitionDiscountPercentage = parseFloat(row.tuitionDiscountPercentage);
        if (isNaN(tuitionDiscountPercentage)) tuitionDiscountPercentage = undefined;
      } else if (row.discountPercentage && (!row.feeType || row.feeType === 'tuition')) {
        tuitionDiscountPercentage = parseFloat(row.discountPercentage);
        if (isNaN(tuitionDiscountPercentage)) tuitionDiscountPercentage = undefined;
      }
      
      // If percentage is provided but not the actual discount, calculate it
      if (tuitionFee && tuitionDiscountPercentage !== undefined && tuitionDiscount === undefined) {
        tuitionDiscount = (tuitionDiscountPercentage / 100) * tuitionFee;
      } 
      
      // Validate grade - use default if not valid
      let grade = row.grade;
      if (!GRADE_LEVELS.includes(grade)) {
        grade = GRADE_LEVELS[0];
      }
      
      // Ensure phone number has correct formatting
      let phone = row.phone || '';
      if (!phone.startsWith('+968') && !phone.startsWith('968')) {
        phone = '+968 ' + phone.replace(/^\+968\s?/, '');
      }
      
      // Create student object
      const student: ImportedStudent = {
        name: row.name || '',
        studentId,
        grade,
        parentName: row.parentName || '',
        phone: phone || '+968 ',
        transportation,
        ...(transportationDirection && { transportationDirection }),
        ...(transportationFee && { transportationFee }),
        ...(customTransportationFee && { customTransportationFee }),
        ...(tuitionFee && { tuitionFee }),
        ...(tuitionDiscount !== undefined && { tuitionDiscount })
      };
      
      students.push(student);
      
      // Create transportation fee if needed
      if (transportation !== 'none' && transportationFee) {
        const transportationFeeObj: ImportedFee = {
          studentId,
          feeType: 'transportation',
          amount: transportationFee,
          discount: 0,
          dueDate: new Date().toISOString().split('T')[0]
        };
        
        fees.push(transportationFeeObj);
      }
      
           // Create tuition fee if provided
      if (tuitionFee && tuitionFee > 0) {
        const tuitionFeeObj: ImportedFee = {
          studentId,
          feeType: 'tuition',
          amount: tuitionFee,
          discount: tuitionDiscount || 0,
          dueDate: row.dueDate || new Date().toISOString().split('T')[0]
        };
        
        fees.push(tuitionFeeObj);
      } 
      
           // Check if any other fee is specified in the row
      if (row.feeType && row.feeType !== 'tuition' && row.feeType !== 'transportation' &&
          row.amount && parseFloat(row.amount) > 0) {
        const amount = parseFloat(row.amount);
        let discount = row.discount ? parseFloat(row.discount) : 0;
        
        // If discount percentage is provided, calculate the discount
        if (row.discountPercentage) {
          const discountPercentage = parseFloat(row.discountPercentage);
          if (!isNaN(discountPercentage) && discountPercentage > 0) {
            // Override the direct discount value with calculated one from percentage
            discount = (discountPercentage / 100) * amount;
          }
        }
        
        const otherFee: ImportedFee = {
          studentId,
          feeType: row.feeType,
          amount: amount,
          discount: discount,
          dueDate: row.dueDate || new Date().toISOString().split('T')[0]
        }; 
        
        fees.push(otherFee);
      }
    }
  });
  
  return { students, fees };
};

// Save imported students and fees to the dataStore
export const saveImportedData = async (
  students: ImportedStudent[], 
  fees: ImportedFee[],
  schoolId: string
): Promise<{ studentsCount: number, feesCount: number }> => {
  let savedStudentsCount = 0;
  let savedFeesCount = 0;
  
  // Map to store imported student IDs to saved student IDs
  const studentIdMap = new Map<string, string>();
  
  try {
    // Get existing students to check for duplicates
    const existingStudents = dataStore.getStudents(schoolId);
    const existingStudentIds = new Set(existingStudents.map(s => s.studentId));
    
    console.log('Students to save:', students.length);
    
    // Save students
    for (const student of students) {
      if (!student.name) continue;
      
      // Skip duplicates by studentId
      if (existingStudentIds.has(student.studentId)) {
        console.log(`Skipping duplicate student: ${student.studentId} - ${student.name}`);
        
        // Find the existing student to get its real ID
        const existingStudent = existingStudents.find(s => s.studentId === student.studentId);
        if (existingStudent) {
          studentIdMap.set(student.studentId, existingStudent.id);
        }
        
        continue;
      }
      
      try {
        // Include all required fields for a student
        const studentToSave: any = {
          name: student.name,
          studentId: student.studentId,
          grade: student.grade,
          parentName: student.parentName || '',
          phone: student.phone || '+968 ',
          whatsapp: student.phone || '+968 ', // Default whatsapp to phone
          address: '', // Empty default address
          transportation: student.transportation || 'none',
          transportationDirection: student.transportationDirection,
          transportationFee: student.transportationFee,
          customTransportationFee: student.customTransportationFee || false,
          schoolId
        };
        
        const savedStudent = dataStore.saveStudent(studentToSave);
        
        // Store the mapping between imported ID and saved ID
        studentIdMap.set(student.studentId, savedStudent.id);
        savedStudentsCount++;
        
        // Add to existing IDs to prevent duplicates within import
        existingStudentIds.add(student.studentId);
        
        console.log(`Saved student: ${student.name} with ID ${savedStudent.id}`);
      } catch (error) {
        console.error('Error saving student:', error);
      }
    }
    
    console.log('Fees to save:', fees.length);
    console.log('Student ID map size:', studentIdMap.size);
    
    // Save fees
    for (const fee of fees) {
      // Skip fees without a valid student ID mapping
      const mappedStudentId = studentIdMap.get(fee.studentId);
      const existingStudent = existingStudents.find(s => s.studentId === fee.studentId);
      
      let realStudentId: string;
      
      if (mappedStudentId) {
        realStudentId = mappedStudentId;
      } else if (existingStudent) {
        realStudentId = existingStudent.id;
        // Add mapping for future use
        studentIdMap.set(fee.studentId, existingStudent.id);
      } else {
        console.log(`Skipping fee for non-existent student: ${fee.studentId}`);
        continue;
      }
      
      // Get student details for the fee
      const student = dataStore.getStudent(realStudentId);
      if (!student) {
        console.log(`Student not found with ID: ${realStudentId}`);
        continue;
      }
      
      try {
        // Prepare description based on fee type
        let description = '';
        if (fee.feeType === 'transportation') {
          const direction = student.transportationDirection 
            ? (student.transportationDirection === 'to-school' ? ' - إلى المدرسة' : ' - من المدرسة')
            : '';
          
          description = `رسوم النقل المدرسي - ${student.transportation === 'one-way' 
            ? 'اتجاه واحد' + direction 
            : 'اتجاهين'}`;
        } else if (fee.feeType === 'tuition') {
          description = `الرسوم الدراسية - ${student.name}`;
        } else {
          description = `${fee.feeType} - ${student.name}`;
        }
        
        // Calculate the balance
        const amount = fee.amount;
        const discount = fee.discount || 0;
        const balance = amount - discount;
        
        // Create fee object with all required fields
        const feeToSave: any = {
          studentId: realStudentId,
          studentName: student.name,
          grade: student.grade,
          feeType: fee.feeType,
          description,
          amount,
          discount,
          paid: 0,
          balance,
          status: 'unpaid',
          dueDate: fee.dueDate || new Date().toISOString().split('T')[0],
          schoolId,
          ...(fee.feeType === 'transportation' && { transportationType: student.transportation })
        };
        
        dataStore.saveFee(feeToSave);
        savedFeesCount++;
        
        console.log(`Saved fee: ${fee.feeType} for student ${student.name} (${amount})`);
      } catch (error) {
        console.error('Error saving fee:', error);
      }
    }
    
    // Trigger data store update to refresh views
    dataStore.notifyListeners();
    
    console.log(`Import finished: ${savedStudentsCount} students, ${savedFeesCount} fees`);
    
  } catch (error) {
    console.error('Error in saveImportedData:', error);
    throw error;
  }
  
  return { studentsCount: savedStudentsCount, feesCount: savedFeesCount };
};

// Generate a template for student import - fully in Arabic
export  const generateStudentTemplateCSV = (): string => {
  const headers = [
    'اسم الطالب',
    'رقم الطالب',
    'الصف',
    'اسم ولي الأمر',
    'رقم الهاتف',
    'النقل',
    'رسوم النقل',
    'الرسوم الدراسية',
    'خصم الرسوم الدراسية',
    'نسبة الخصم %'
  ];
  
   const rows = [
    'أحمد محمد,S1001,الروضة KG1,محمد أحمد,+968 95123456,اتجاهين,300,1000,0,0', 
    'فاطمة خالد,S1002,التمهيدي KG2,خالد علي,+968 95123457,اتجاه واحد - إلى المدرسة,150,1000,100,10',
    'علي حسن,S1003,الصف الأول,حسن علي,+968 95123458,اتجاه واحد - من المدرسة,150,1000,0,0',
    'محمد سالم,S1004,الصف الثاني,سالم محمد,+968 95123459,لا يوجد,0,1000,50,5'
  ]; 
  
  // Add BOM for UTF-8
  const BOM = "\uFEFF";
  return BOM + [headers.join(','), ...rows].join('\n');
};

// Generate a template for fee import - fully in Arabic
export  const generateFeeTemplateCSV = (): string => {
  const headers = [
    'رقم الطالب',
    'نوع الرسوم',
    'المبلغ',
    'الخصم',
    'نسبة الخصم %',
    'تاريخ الاستحقاق'
  ];
  
  const rows = [
    'S1001,tuition,1000,0,0,2023-09-01',
    'S1001,transportation,300,0,0,2023-09-01',
    'S1002,tuition,1000,100,10,2023-09-01',
    'S1002,books,200,0,0,2023-09-01'
  ]; 
  
  // Add BOM for UTF-8
  const BOM = "\uFEFF";
  return BOM + [headers.join(','), ...rows].join('\n');
};

export default {
  parseCSV,
  excelToCSV,
  processImportedStudents,
  saveImportedData,
  generateStudentTemplateCSV,
  generateFeeTemplateCSV
};
 