import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, Upload, Download, Filter, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { TRANSPORTATION_TYPES, GRADE_LEVELS, CURRENCY } from '../../../utils/constants';
import dataStore from '../../../services/dataStore';
import { generateStudentTemplateCSV } from '../../../services/importExport';
import ImportDialog from '../../../components/ImportDialog';

interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  parentName: string;
  phone: string;
  transportation: 'none' | 'one-way' | 'two-way';
  transportationDirection?: 'to-school' | 'from-school';
}

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTransport, setSelectedTransport] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<{studentsCount: number; feesCount: number} | null>(null);
  const [settings, setSettings] = useState<any>({
    transportationFeeOneWay: 150,
    transportationFeeTwoWay: 300
  });

  // Subscribe to data store changes
  useEffect(() => {
    const fetchStudents = () => {
      setIsLoading(true);
      let fetchedStudents;
      
      try {
        if (user?.role === 'gradeManager' && user?.gradeLevels && user.gradeLevels.length > 0) {
          fetchedStudents = dataStore.getStudents(user.schoolId, user.gradeLevels);
        } else {
          fetchedStudents = dataStore.getStudents(user?.schoolId);
        }
        
        console.log('Fetched students:', fetchedStudents);
        setStudents(fetchedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Get school settings
    if (user?.schoolId) {
      const schoolSettings = dataStore.getSettings(user.schoolId);
      setSettings(schoolSettings);
    }
    
    fetchStudents();
    
    // Subscribe to data store changes
    const unsubscribe = dataStore.subscribe(() => {
      fetchStudents();
    });
    
    return () => unsubscribe();
  }, [user]);

  // Apply filters whenever students, selected grade or transport changes
  useEffect(() => {
    let result = students;
    
    if (selectedGrade !== 'all') {
      result = result.filter((student) => student.grade === selectedGrade);
    }
    
    if (selectedTransport !== 'all') {
      result = result.filter((student) => {
        if (selectedTransport === 'none') {
          return student.transportation === 'none';
        } else if (selectedTransport === 'one-way') {
          return student.transportation === 'one-way';
        } else if (selectedTransport === 'two-way') {
          return student.transportation === 'two-way';
        } else if (selectedTransport === 'any') {
          return student.transportation !== 'none';
        }
        return true;
      });
    }
    
    setFilteredStudents(result);
  }, [selectedGrade, selectedTransport, students]);

  const handleFilter = (grade: string) => {
    setSelectedGrade(grade);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      dataStore.deleteStudent(id);
    }
  };

  const handleImportStudents = () => {
    setImportDialogOpen(true);
    setImportResult(null);
  };
  
  const handleExportStudents = () => {
    const headers = ['اسم الطالب', 'رقم الطالب', 'الصف', 'اسم ولي الأمر', 'رقم الهاتف', 'النقل'];
    
    const csvRows = [
      headers.join(','),
      ...filteredStudents.map(student => {
        let transportationValue = 'لا يوجد';
        if (student.transportation === 'one-way') {
          transportationValue = 'اتجاه واحد';
          if (student.transportationDirection) {
            transportationValue += student.transportationDirection === 'to-school' 
              ? ' - إلى المدرسة' 
              : ' - من المدرسة';
          }
        } else if (student.transportation === 'two-way') {
          transportationValue = 'اتجاهين';
        }
        
        return [
          student.name,
          student.studentId,
          student.grade,
          student.parentName,
          student.phone,
          transportationValue
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
    a.download = 'قائمة_الطلبة.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTransportationLabel = (transport: string, direction?: string) => {
    if (transport === 'none') return 'لا يوجد';
    if (transport === 'one-way') {
      let label = 'اتجاه واحد';
      if (direction) {
        label += direction === 'to-school' ? ' (إلى المدرسة)' : ' (من المدرسة)';
      }
      return label;
    }
    return 'اتجاهين';
  };

  // Get unique grades for filter
  const grades = ['all', ...Array.from(new Set(students.map((student) => student.grade)))];

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
        <h1 className="text-2xl font-bold text-gray-800">إدارة الطلبة</h1>
        <Link to="/school/students/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span>إضافة طالب</span>
        </Link>
      </div>
      
      {importResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-medium">تم الاستيراد بنجاح!</p>
            <p className="text-sm">تم استيراد {importResult.studentsCount} طالب و {importResult.feesCount} رسوم مالية.</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-600" />
            <span className="font-medium">تصفية:</span>
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
            value={selectedTransport}
            onChange={(e) => setSelectedTransport(e.target.value)}
          >
            <option value="all">جميع خيارات النقل</option>
            <option value="any">مع نقل</option>
            <option value="none">بدون نقل</option>
            <option value="one-way">اتجاه واحد</option>
            <option value="two-way">اتجاهين</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            onClick={handleImportStudents}
            title="استيراد الطلبة من ملف CSV"
          >
            <Upload size={16} />
            <span>استيراد</span>
          </button>
          
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            onClick={handleExportStudents}
            title="تصدير قائمة الطلبة"
          >
            <Download size={16} />
            <span>تصدير</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-gray-800">قائمة الطلبة</h2>
          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
            {filteredStudents.length}
          </span>
        </div>
        
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا يوجد طلبة مطابقين لمعايير البحث
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الطالب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الطالب
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الصف
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ولي الأمر
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الهاتف
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النقل المدرسي
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.grade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.parentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{student.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${student.transportation !== 'none' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                        {getTransportationLabel(student.transportation, student.transportationDirection)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium flex items-center space-x-2 space-x-reverse">
                      <Link
                        to={`/school/students/${student.id}`}
                        className="text-primary hover:text-primary-dark"
                        title="تعديل"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-800"
                        title="حذف"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <ImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={setImportResult}
        templateGenerator={generateStudentTemplateCSV}
        templateFileName="قالب_استيراد_الطلبة.csv"
        schoolId={user?.schoolId || ''}
        importType="students"
      />
    </div>
  );
};

export default Students;
 