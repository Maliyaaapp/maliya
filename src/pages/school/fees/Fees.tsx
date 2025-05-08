import   { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, Filter, CreditCard, MessageSquare, Download, Upload, User, ChevronDown, ChevronUp, Book, Bus, CreditCard as PaymentIcon, ChevronRight } from 'lucide-react'; 
import { useAuth } from '../../../contexts/AuthContext';
import { FEE_TYPES, CURRENCY } from '../../../utils/constants';
import dataStore from '../../../services/dataStore';
import pdfPrinter from '../../../services/pdfPrinter';
import { generateFeeTemplateCSV } from '../../../services/importExport';
import ImportDialog from '../../../components/ImportDialog';

interface Fee {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  feeType: string;
  transportationType?: 'one-way' | 'two-way';
  amount: number;
  discount: number;
  paid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
  dueDate: string;
  phone?: string;
}

interface StudentFeeGroup {
  studentId: string;
  studentName: string;
  grade: string;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  tuitionFees: Fee[];
  transportationFees: Fee[];
  otherFees: Fee[];
  expandedSections: {
    tuition: boolean;
    transportation: boolean;
    other: boolean;
  }
}

const Fees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [filteredFees, setFilteredFees] = useState<Fee[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<{studentsCount: number; feesCount: number} | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [paymentProcessing, setPaymentProcessing] = useState<string | null>(null);
  
  // For student-based view
  const [studentList, setStudentList] = useState<{id: string, name: string, grade: string}[]>([]);
  const [studentFeeGroups, setStudentFeeGroups] = useState<StudentFeeGroup[]>([]);
  const [displayMode, setDisplayMode] = useState<'list' | 'student'>('student');
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  // Fetch data and subscribe to changes
  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      try {
        let fetchedFees;
        let fetchedStudents;
        
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          fetchedFees = dataStore.getFees(user.schoolId, undefined, user.gradeLevels);
          fetchedStudents = dataStore.getStudents(user.schoolId, user.gradeLevels);
        } else {
          fetchedFees = dataStore.getFees(user?.schoolId);
          fetchedStudents = dataStore.getStudents(user?.schoolId);
        }
        
        // Augment fees with student phone numbers for WhatsApp
        const augmentedFees = fetchedFees.map((fee: any) => {
          const student = dataStore.getStudent(fee.studentId);
          return {
            ...fee,
            phone: student?.phone || '',
          };
        });
        
        setFees(augmentedFees);
        
        // Format student data
        const formattedStudents = fetchedStudents.map((student: any) => ({
          id: student.id,
          name: student.name,
          grade: student.grade
        }));
        
        setStudentList(formattedStudents);
        
        // Process student fee groups
        processStudentFeeGroups(augmentedFees);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      fetchData();
    });
    
    return () => unsubscribe();
  }, [user]);

  // Apply filters whenever fees or filter options change
  useEffect(() => {
    let result = fees;
    
    if (selectedGrade !== 'all') {
      result = result.filter((fee) => fee.grade === selectedGrade);
    }
    
    if (selectedType !== 'all') {
      result = result.filter((fee) => fee.feeType === selectedType);
    }
    
    if (selectedStatus !== 'all') {
      result = result.filter((fee) => fee.status === selectedStatus);
    }
    
    if (selectedStudent !== 'all') {
      result = result.filter((fee) => fee.studentId === selectedStudent);
    }
    
    setFilteredFees(result);
    processStudentFeeGroups(result);
  }, [selectedGrade, selectedType, selectedStatus, selectedStudent, fees]);

  const processStudentFeeGroups = (feesList: Fee[]) => {
    // Add safety check to ensure feesList is an array
    if (!feesList || !Array.isArray(feesList)) {
      console.error('Error: feesList is not an array:', feesList);
      setStudentFeeGroups([]);
      return;
    }
    
    const studentMap = new Map<string, StudentFeeGroup>();
    
    feesList.forEach(fee => {
      if (!fee || typeof fee !== 'object') {
        console.error('Invalid fee object:', fee);
        return; // Skip this iteration
      }
      
      if (!studentMap.has(fee.studentId)) {
        studentMap.set(fee.studentId, {
          studentId: fee.studentId,
          studentName: fee.studentName,
          grade: fee.grade,
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
          tuitionFees: [],
          transportationFees: [],
          otherFees: [],
          expandedSections: {
            tuition: true,
            transportation: true,
            other: true
          }
        });
      }
      
      const studentGroup = studentMap.get(fee.studentId)!;
      studentGroup.totalAmount += fee.amount;
      studentGroup.totalPaid += fee.paid;
      studentGroup.totalBalance += fee.balance;
      
      // Categorize fee
      if (fee.feeType === 'tuition') {
        studentGroup.tuitionFees.push(fee);
      } else if (fee.feeType === 'transportation') {
        studentGroup.transportationFees.push(fee);
      } else {
        studentGroup.otherFees.push(fee);
      }
    });
    
    // Convert to array and sort by name
    const groups = Array.from(studentMap.values());
    groups.sort((a, b) => a.studentName.localeCompare(b.studentName));
    
    setStudentFeeGroups(groups);
  };

  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const toggleFeeSection = (studentId: string, sectionType: 'tuition' | 'transportation' | 'other') => {
    const updatedGroups = studentFeeGroups.map(group => {
      if (group.studentId === studentId) {
        return {
          ...group,
          expandedSections: {
            ...group.expandedSections,
            [sectionType]: !group.expandedSections[sectionType]
          }
        };
      }
      return group;
    });
    
    setStudentFeeGroups(updatedGroups);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الرسوم؟')) {
      dataStore.deleteFee(id);
    }
  };

   const handlePrintReceipt = (id: string) => {
    try {
      // Find the fee to generate receipt for
      const fee = fees.find(f => f.id === id);
      if (!fee) {
        console.error('Fee not found with ID:', id);
        return;
      }
      
      // Generate receipt data
      const receiptData = {
        receiptNumber: `R-${fee.id.substring(0, 8)}`,
        date: new Date().toLocaleDateString('en-GB'), // Using Georgian date format
        studentName: fee.studentName,
        studentId: fee.studentId,
        grade: fee.grade,
        feeType: getFeeTypeLabel(fee.feeType) + (fee.transportationType ? 
          ` (${fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'})` : ''),
        amount: fee.paid,
        schoolName: user?.schoolName || 'مدرسة السلطان قابوس',
        schoolLogo: user?.schoolLogo || ''
      };
      
      console.log('Printing receipt for:', receiptData);
      
      // Print receipt using browser's print functionality
      pdfPrinter.printReceipt(receiptData);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('حدث خطأ أثناء إنشاء الإيصال. يرجى المحاولة مرة أخرى.');
    }
  }; 

  const handleSendWhatsApp = async (id: string) => {
    // Find the fee to send message about
    const fee = fees.find(f => f.id === id);
    if (!fee) return;
    
    try {
      // Get student to get the phone number
      const student = dataStore.getStudent(fee.studentId);
      if (!student) {
        alert('لم يتم العثور على بيانات الطالب');
        return;
      }
      
      const message = `تذكير: الرسوم المستحقة للطالب ${fee.studentName} بمبلغ ${fee.balance} ${CURRENCY} من ${user?.schoolName || 'المدرسة'}`;
      
      // For demo, open WhatsApp web
      const encodedMessage = encodeURIComponent(message);
      const phone = student.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      // Add message to history
      dataStore.saveMessage({
        id: '',
        studentId: fee.studentId,
        studentName: fee.studentName,
        grade: fee.grade,
        parentName: student.parentName,
        phone: student.phone,
        template: 'تذكير بالرسوم',
        message,
        sentAt: new Date().toISOString(),
        status: 'delivered',
        schoolId: user?.schoolId || ''
      });
      
      alert(`تم إرسال إشعار دفع عبر الواتساب للطالب ${fee.studentName}`);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      alert('حدث خطأ أثناء إرسال الرسالة');
    }
  };
  
  const handlePaymentComplete = (id: string) => {
    // Find the fee to mark as paid
    const fee = fees.find(f => f.id === id);
    if (!fee) return;
    
    setPaymentProcessing(id);
    
    try {
      // Update fee to paid status
      const updatedFee = {
        ...fee,
        paid: fee.amount - fee.discount, // Pay full amount minus discount
        balance: 0,
        status: 'paid'
      };
      
      // Save updated fee
      dataStore.saveFee(updatedFee);
      
      // Create receipt after payment
      setTimeout(() => {
        handlePrintReceipt(id);
        setPaymentProcessing(null);
      }, 800);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('حدث خطأ أثناء معالجة الدفع');
      setPaymentProcessing(null);
    }
  };
  
  const handlePayAllFeesForStudent = (studentId: string) => {
    // Find all unpaid fees for this student
    const studentFees = fees.filter(f => f.studentId === studentId && f.balance > 0);
    if (studentFees.length === 0) return;
    
    if (!window.confirm(`هل أنت متأكد من دفع جميع الرسوم غير المدفوعة للطالب ${studentFees[0].studentName}؟ المبلغ الإجمالي: ${studentFees.reduce((sum, fee) => sum + fee.balance, 0)} ${CURRENCY}`)) {
      return;
    }
    
    setPaymentProcessing(studentId);
    
    try {
      // Update all fees to paid status
      studentFees.forEach(fee => {
        const updatedFee = {
          ...fee,
          paid: fee.amount - fee.discount, // Pay full amount minus discount
          balance: 0,
          status: 'paid'
        };
        
        // Save updated fee
        dataStore.saveFee(updatedFee);
      });
      
      // Show success message
      alert(`تم دفع جميع الرسوم بنجاح للطالب ${studentFees[0].studentName}`);
      
      setTimeout(() => {
        setPaymentProcessing(null);
      }, 800);
    } catch (error) {
      console.error('Error processing bulk payment:', error);
      alert('حدث خطأ أثناء معالجة عملية الدفع');
      setPaymentProcessing(null);
    }
  };
  
  const handlePrintStudentReport = (studentId: string) => {
    const student = dataStore.getStudent(studentId);
    if (!student) return;
    
    const studentFees = fees.filter(f => f.studentId === studentId);
    
    const reportData = {
      studentName: student.name,
      studentId: student.studentId,
      grade: student.grade,
      fees: studentFees.map(fee => ({
        type: getFeeTypeLabel(fee.feeType) + (fee.transportationType ? 
          ` (${fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'})` : ''),
        amount: fee.amount,
        paid: fee.paid,
        balance: fee.balance
      })),
      schoolName: user?.schoolName || 'مدرسة السلطان قابوس',
      schoolLogo: user?.schoolLogo
    };
    
    try {
      // Print report using browser's print functionality
      pdfPrinter.printStudentReport(reportData);
    } catch (error) {
      console.error('Error generating student report:', error);
      alert('حدث خطأ أثناء إنشاء التقرير المالي للطالب');
    }
  };
  
  const handleImportFees = () => {
    setImportDialogOpen(true);
    setImportResult(null);
    setImportSuccess(false);
  };
  
  const handleImportSuccess = (result: {studentsCount: number; feesCount: number}) => {
    setImportResult(result);
    setImportSuccess(true);
    
    // Auto-hide the success message after 5 seconds
    setTimeout(() => {
      setImportSuccess(false);
    }, 5000);
  };
  
  const handleExportFees = () => {
    const headers = ['رقم الطالب', 'اسم الطالب', 'الصف', 'نوع الرسوم', 'المبلغ', 'الخصم', 'نسبة الخصم', 'المدفوع', 'المتبقي', 'الحالة', 'تاريخ الاستحقاق'];
    
    const csvRows = [
      headers.join(','),
      ...filteredFees.map(fee => {
        // Calculate discount percentage
        const discountPercentage = fee.amount > 0 ? (fee.discount / fee.amount) * 100 : 0;
        return [
          fee.studentId,
          fee.studentName,
          fee.grade,
          getFeeTypeLabel(fee.feeType) + (fee.transportationType ? ` (${fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'})` : ''),
          fee.amount,
          fee.discount,
          discountPercentage.toFixed(2) + '%',
          fee.paid,
          fee.balance,
          getStatusLabel(fee.status),
          fee.dueDate // Using Georgian date format directly from database
        ].join(',');
      })
    ];
    
    // Create BOM for UTF-8
    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'قائمة_الرسوم.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFeeTypeLabel = (type: string) => {
    const feeType = FEE_TYPES.find(t => t.id === type);
    return feeType ? feeType.name : type;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'partial':
        return 'مدفوع جزئياً';
      case 'unpaid':
        return 'غير مدفوع';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique grades for filter
  const grades = ['all', ...Array.from(new Set(fees.map((fee) => fee.grade)))];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الرسوم المالية</h1>
        <Link to="/school/fees/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>إضافة رسوم</span>
        </Link>
      </div>
      
      {importSuccess && importResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-medium">تم الاستيراد بنجاح!</p>
            <p className="text-sm">
              {importResult.studentsCount > 0 ? `تم استيراد ${importResult.studentsCount} طالب و ` : ''}
              تم استيراد {importResult.feesCount} رسوم مالية بنجاح.
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="font-bold">عرض:</span>
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 ${displayMode === 'list' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setDisplayMode('list')}
            >
              قائمة الرسوم
            </button>
            <button
              className={`px-4 py-2 ${displayMode === 'student' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setDisplayMode('student')}
            >
              حسب الطالب
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            onClick={handleImportFees}
            title="استيراد الرسوم من ملف CSV"
          >
            <Upload size={16} />
            <span>استيراد</span>
          </button>
          
          <button
            type="button" 
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            onClick={handleExportFees}
            title="تصدير قائمة الرسوم"
          >
            <Download size={16} />
            <span>تصدير</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-600" />
            <span>تصفية:</span>
          </div>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="all">جميع الصفوف</option>
            {grades.filter((g) => g !== 'all').map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">جميع أنواع الرسوم</option>
            {FEE_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوع</option>
            <option value="partial">مدفوع جزئياً</option>
            <option value="unpaid">غير مدفوع</option>
          </select>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="all">جميع الطلبة</option>
            {studentList.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <ImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={handleImportSuccess}
        templateGenerator={generateFeeTemplateCSV}
        templateFileName="قالب_استيراد_الرسوم.csv"
        schoolId={user?.schoolId || ''}
        importType="fees"
      />
      
      {/* Student-based View */}
      {displayMode === 'student' && (
        <div className="space-y-6">
          {studentFeeGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              لا توجد رسوم مطابقة لمعايير البحث
            </div>
          ) : (
            studentFeeGroups.map(student => (
              <div key={student.studentId} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div 
                  className="p-4 border-b bg-gray-50 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleStudentExpanded(student.studentId)}
                >
                  <div className="flex items-center gap-3">
                    {expandedStudents[student.studentId] ? (
                      <ChevronDown size={20} className="text-gray-600" />
                    ) : (
                      <ChevronUp size={20} className="text-gray-600" />
                    )}
                    <div>
                      <div className="font-bold text-lg">{student.studentName}</div>
                      <div className="text-gray-600 text-sm">{student.grade}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">الإجمالي</div>
                      <div className="font-bold">{student.totalAmount.toLocaleString()} {CURRENCY}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500">المدفوع</div>
                      <div className="font-bold text-green-600">{student.totalPaid.toLocaleString()} {CURRENCY}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500">المتبقي</div>
                      <div className="font-bold text-red-600">{student.totalBalance.toLocaleString()} {CURRENCY}</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintStudentReport(student.studentId);
                        }}
                        title="طباعة تقرير مالي"
                      >
                        <Download size={18} className="text-gray-600" />
                      </button>
                      
                      {student.totalBalance > 0 && (
                        <button
                          type="button"
                          className="p-2 rounded-full hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePayAllFeesForStudent(student.studentId);
                          }}
                          disabled={paymentProcessing === student.studentId}
                          title="دفع جميع الرسوم المستحقة"
                        >
                          <PaymentIcon size={18} className="text-green-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedStudents[student.studentId] && (
                  <div className="p-4">
                    {/* Tuition Fees Section */}
                    {student.tuitionFees.length > 0 && (
                      <div className="mb-6">
                        <div 
                          className="flex items-center gap-2 mb-3 cursor-pointer"
                          onClick={() => toggleFeeSection(student.studentId, 'tuition')}
                        >
                          <Book size={18} className="text-primary" />
                          <h3 className="text-lg font-bold">الرسوم الدراسية</h3>
                          {student.expandedSections.tuition ? (
                            <ChevronDown size={16} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-600" />
                          )}
                        </div>
                        
                        {student.expandedSections.tuition && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الوصف
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المبلغ
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الخصم
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المتبقي
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الحالة
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الإجراءات
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {student.tuitionFees.map(fee => (
                                  <tr key={fee.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{fee.description || getFeeTypeLabel(fee.feeType)}</div>
                                      <div className="text-sm text-gray-500">تاريخ الاستحقاق: {new Date(fee.dueDate).toLocaleDateString('en-GB')}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium">{fee.amount.toLocaleString()} {CURRENCY}</div>
                                      {fee.discount > 0 && (
                                        <div className="text-xs text-green-600">خصم: {fee.discount.toLocaleString()} {CURRENCY}</div>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-green-600">{fee.discount.toLocaleString()} {CURRENCY}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className={`text-sm ${fee.balance > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                        {fee.balance.toLocaleString()} {CURRENCY}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                                        {getStatusLabel(fee.status)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex items-center gap-2">
                                        <Link to={`/school/fees/${fee.id}`} className="text-indigo-600 hover:text-indigo-900">
                                          <Edit size={16} />
                                        </Link>
                                        {fee.status !== 'paid' && (
                                          <button 
                                            type="button"
                                            onClick={() => handlePaymentComplete(fee.id)}
                                            disabled={paymentProcessing === fee.id}
                                            className="text-green-600 hover:text-green-900"
                                          >
                                            <PaymentIcon size={16} />
                                          </button>
                                        )}
                                        <button 
                                          type="button"
                                          onClick={() => handleDelete(fee.id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          <Trash size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Transportation Fees Section */}
                    {student.transportationFees.length > 0 && (
                      <div className="mb-6">
                        <div 
                          className="flex items-center gap-2 mb-3 cursor-pointer"
                          onClick={() => toggleFeeSection(student.studentId, 'transportation')}
                        >
                          <Bus size={18} className="text-primary" />
                          <h3 className="text-lg font-bold">رسوم النقل</h3>
                          {student.expandedSections.transportation ? (
                            <ChevronDown size={16} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-600" />
                          )}
                        </div>
                        
                        {student.expandedSections.transportation && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الوصف
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المبلغ
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المتبقي
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الحالة
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الإجراءات
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {student.transportationFees.map(fee => (
                                  <tr key={fee.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {fee.description || (fee.transportationType === 'one-way' ? 'نقل مدرسي (اتجاه واحد)' : 'نقل مدرسي (اتجاهين)')}
                                      </div>
                                      <div className="text-sm text-gray-500">تاريخ الاستحقاق: {new Date(fee.dueDate).toLocaleDateString('en-GB')}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium">{fee.amount.toLocaleString()} {CURRENCY}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className={`text-sm ${fee.balance > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                        {fee.balance.toLocaleString()} {CURRENCY}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                                        {getStatusLabel(fee.status)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex items-center gap-2">
                                        <Link to={`/school/fees/${fee.id}`} className="text-indigo-600 hover:text-indigo-900">
                                          <Edit size={16} />
                                        </Link>
                                        {fee.status !== 'paid' && (
                                          <button 
                                            type="button"
                                            onClick={() => handlePaymentComplete(fee.id)}
                                            disabled={paymentProcessing === fee.id}
                                            className="text-green-600 hover:text-green-900"
                                          >
                                            <PaymentIcon size={16} />
                                          </button>
                                        )}
                                        <button 
                                          type="button"
                                          onClick={() => handleDelete(fee.id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          <Trash size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Other Fees Section */}
                    {student.otherFees.length > 0 && (
                      <div>
                        <div 
                          className="flex items-center gap-2 mb-3 cursor-pointer"
                          onClick={() => toggleFeeSection(student.studentId, 'other')}
                        >
                          <CreditCard size={18} className="text-primary" />
                          <h3 className="text-lg font-bold">رسوم أخرى</h3>
                          {student.expandedSections.other ? (
                            <ChevronDown size={16} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-600" />
                          )}
                        </div>
                        
                        {student.expandedSections.other && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    النوع
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المبلغ
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    المتبقي
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الحالة
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الإجراءات
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {student.otherFees.map(fee => (
                                  <tr key={fee.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{fee.description || getFeeTypeLabel(fee.feeType)}</div>
                                      <div className="text-sm text-gray-500">تاريخ الاستحقاق: {new Date(fee.dueDate).toLocaleDateString('en-GB')}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium">{fee.amount.toLocaleString()} {CURRENCY}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className={`text-sm ${fee.balance > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                        {fee.balance.toLocaleString()} {CURRENCY}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                                        {getStatusLabel(fee.status)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex items-center gap-2">
                                        <Link to={`/school/fees/${fee.id}`} className="text-indigo-600 hover:text-indigo-900">
                                          <Edit size={16} />
                                        </Link>
                                        {fee.status !== 'paid' && (
                                          <button 
                                            type="button"
                                            onClick={() => handlePaymentComplete(fee.id)}
                                            disabled={paymentProcessing === fee.id}
                                            className="text-green-600 hover:text-green-900"
                                          >
                                            <PaymentIcon size={16} />
                                          </button>
                                        )}
                                        <button 
                                          type="button"
                                          onClick={() => handleDelete(fee.id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          <Trash size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* List View */}
      {displayMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-800">قائمة الرسوم</h2>
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {filteredFees.length}
            </span>
          </div>
          
          {filteredFees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد رسوم مطابقة لمعايير البحث
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطالب
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الصف
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نوع الرسوم
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المدفوع
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المتبقي
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{fee.studentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{fee.grade}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {getFeeTypeLabel(fee.feeType)}
                          {fee.transportationType && (
                            <span className="text-xs block">
                              {fee.transportationType === 'one-way' ? 'اتجاه واحد' : 'اتجاهين'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{fee.amount.toLocaleString()} {CURRENCY}</div>
                        {fee.discount > 0 && (
                          <div className="text-xs text-green-600">
                            خصم: {fee.discount.toLocaleString()} {CURRENCY}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-green-600">{fee.paid.toLocaleString()} {CURRENCY}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`${fee.balance > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {fee.balance.toLocaleString()} {CURRENCY}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                          {getStatusLabel(fee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Link
                            to={`/school/fees/${fee.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="تعديل"
                          >
                            <Edit size={18} />
                          </Link>
                          
                          {fee.status !== 'paid' && (
                            <>
                              <button
                                onClick={() => handlePaymentComplete(fee.id)}
                                className="text-green-600 hover:text-green-900"
                                title="تحديد كمدفوع"
                                disabled={paymentProcessing === fee.id}
                              >
                                <PaymentIcon size={18} />
                              </button>
                              
                              <button
                                onClick={() => handleSendWhatsApp(fee.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="إرسال واتساب"
                              >
                                <MessageSquare size={18} />
                              </button>
                            </>
                          )}
                          
                          {fee.status === 'paid' && (
                            <button
                              onClick={() => handlePrintReceipt(fee.id)}
                              className="text-gray-600 hover:text-gray-900"
                              title="طباعة إيصال"
                            >
                              <Download size={18} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(fee.id)}
                            className="text-red-600 hover:text-red-900"
                            title="حذف"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Fees;
 