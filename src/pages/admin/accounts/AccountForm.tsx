import  { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowRight, Plus, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { GRADE_LEVELS } from '../../../utils/constants';
import api from '../../../services/api';
import { DATABASE_ID, USERS_COLLECTION_ID } from '../../../services/appwrite';

interface School {
  id: string;
  name: string;
  logo?: string;
}

interface AccountFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  schoolId: string;
  gradeLevels: string[];
}

const AccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, syncAccounts } = useAuth();
  
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'schoolAdmin',
    schoolId: '',
    gradeLevels: []
  });
  
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch schools for the dropdown
        const schoolsResponse = await api.getSchools();
        if (schoolsResponse.success) {
          setSchools(schoolsResponse.data);
        }
        
        if (isEditMode && id) {
          // Fetch account data
          const accountResponse = await api.getAccount(id);
          if (accountResponse.success) {
            const account = accountResponse.data;
            setFormData({
              name: account.name || '',
              email: account.email || '',
              username: account.username || account.email || '',
              password: '',
              role: account.role || 'schoolAdmin',
              schoolId: account.schoolId || '',
              gradeLevels: account.gradeLevels || []
            });
          } else {
            navigate('/admin/accounts');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear errors when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleGradeLevelChange = (gradeLevel: string) => {
    const isSelected = formData.gradeLevels.includes(gradeLevel);
    
    if (isSelected) {
      // Remove grade level
      setFormData({
        ...formData,
        gradeLevels: formData.gradeLevels.filter(gl => gl !== gradeLevel)
      });
    } else {
      // Add grade level
      setFormData({
        ...formData,
        gradeLevels: [...formData.gradeLevels, gradeLevel]
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'الاسم مطلوب';
    }
    
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    
    if (!formData.username) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }
    
    if (!isEditMode && !formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    
    if (formData.role === 'gradeManager' && (!formData.schoolId || formData.gradeLevels.length === 0)) {
      newErrors.gradeLevels = 'يجب اختيار المدرسة والصفوف للمدير الصف';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setErrors({});
    
    try {
      console.log('Saving account with data:', formData);
      console.log('Using DATABASE_ID:', DATABASE_ID);
      console.log('Using USERS_COLLECTION_ID:', USERS_COLLECTION_ID);
      
      let response;
      
      if (isEditMode && id) {
        // Update existing account
        console.log('Updating existing account with ID:', id);
        response = await api.updateAccount(id, formData);
      } else {
        // Create new account
        console.log('Creating new account');
        response = await api.createAccount(
          formData.email,
          formData.password,
          formData.name,
          formData.username,
          formData.role,
          formData.schoolId,
          formData.gradeLevels
        );
      }
      
      console.log('API response:', response);
      
      if (response.success) {
        // Always sync accounts after account creation/update
        console.log('Account saved successfully, syncing accounts...');
        try {
          await syncAccounts();
          console.log('Accounts synchronized successfully');
        } catch (syncError) {
          console.error('Error syncing accounts after save:', syncError);
          // Continue anyway as the account was created successfully
        }
        
        // Navigate back to accounts list
        setIsSaving(false);
        navigate('/admin/accounts');
      } else {
        console.error('API error response:', response.error);
        
        const errorMessage = response.error || 'حدث خطأ أثناء حفظ الحساب';
        
        // Handle specific error cases in a more comprehensive way
        if (errorMessage.includes('البريد الإلكتروني') || 
            errorMessage.includes('email') || 
            errorMessage.includes('duplicate')) {
          setErrors({
            ...errors,
            email: 'هذا البريد الإلكتروني مستخدم بالفعل، الرجاء استخدام بريد إلكتروني آخر'
          });
        } else if (errorMessage.includes('اسم المستخدم') || errorMessage.includes('username')) {
          setErrors({
            ...errors,
            username: 'اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر'
          });
        } else if (errorMessage.includes('المدرسة') || errorMessage.includes('school')) {
          setErrors({
            ...errors,
            schoolId: 'حدث خطأ متعلق بالمدرسة، الرجاء التحقق من اختيارك'
          });
        } else if (errorMessage.includes('كلمة المرور') || errorMessage.includes('password')) {
          setErrors({
            ...errors,
            password: 'كلمة المرور غير صالحة. يجب أن تكون 8 أحرف على الأقل وتحتوي على رقم وحرف كبير'
          });
        } else {
          // General error handling
          alert(errorMessage);
        }
        
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error saving account:', error);
      if (error instanceof Error) {
        alert(`حدث خطأ أثناء حفظ الحساب: ${error.message}`);
      } else {
        alert('حدث خطأ غير معروف أثناء حفظ الحساب');
      }
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/accounts')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد'}
        </h1>
      </div>
      
      {!isEditMode && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <p className="text-blue-700 text-sm">
            <strong>ملاحظة مهمة:</strong> لتجنب مشاكل التكرار، سيتم تعديل البريد الإلكتروني داخليًا بإضافة رقم تسلسلي خاص للتسجيل في نظام Appwrite.
            سيظل البريد الإلكتروني الذي تدخله هو المعروض في واجهة المستخدم والتقارير.
          </p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">بيانات الحساب</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="email">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
              {!isEditMode && (
                <p className="text-xs text-gray-500 mt-1">
                  في حالة وجود مشكلة بتكرار البريد الإلكتروني، حاول إضافة أرقام عشوائية مثل: username123@example.com
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="username">
                اسم المستخدم <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className={`input ${errors.username ? 'border-red-500' : ''}`}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                يمكن استخدام اسم المستخدم أو البريد الإلكتروني لتسجيل الدخول
              </p>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="password">
                {isEditMode ? 'كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور'}
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="role">
                الدور <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="schoolAdmin">مدير مدرسة</option>
                <option value="gradeManager">مدير صف</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="schoolId">
                المدرسة <span className="text-red-500">*</span>
              </label>
              <select
                id="schoolId"
                name="schoolId"
                className={`input ${errors.schoolId ? 'border-red-500' : ''}`}
                value={formData.schoolId}
                onChange={handleChange}
              >
                <option value="">-- اختر المدرسة --</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <p className="text-red-500 text-sm mt-1">{errors.schoolId}</p>
              )}
            </div>
            
            {formData.role === 'gradeManager' && (
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">
                  الصفوف الدراسية <span className="text-red-500">*</span>
                </label>
                <div className={`p-3 border rounded-md ${errors.gradeLevels ? 'border-red-500' : 'border-gray-300'}`}>
                  {formData.gradeLevels.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.gradeLevels.map((grade) => (
                        <div key={grade} className="bg-primary-light/10 px-3 py-1 rounded-full flex items-center gap-1">
                          <span className="text-primary text-sm">{grade}</span>
                          <button
                            type="button"
                            onClick={() => handleGradeLevelChange(grade)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 mb-3">لم يتم اختيار أي صف</div>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {GRADE_LEVELS.map((grade) => (
                      <div 
                        key={grade}
                        className={`px-3 py-2 border rounded-md text-sm cursor-pointer transition-colors ${
                          formData.gradeLevels.includes(grade) 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white hover:bg-gray-50 border-gray-300'
                        }`}
                        onClick={() => handleGradeLevelChange(grade)}
                      >
                        {grade}
                      </div>
                    ))}
                  </div>
                </div>
                {errors.gradeLevels && (
                  <p className="text-red-500 text-sm mt-1">{errors.gradeLevels}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/accounts')}
              className="btn btn-secondary ml-3"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={isSaving}
            >
              <Save size={18} />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountForm;
 