import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Key, Users, RefreshCw, Book } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import AccountSyncStatus from '../../../components/AccountSyncStatus';
import GradeRestrictionsModal from './GradeRestrictionsModal';

interface Account {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  schoolId: string;
  school: string;
  gradeLevels?: string[];
  lastLogin: string;
}

const AccountsList = () => {
  const navigate = useNavigate();
  const { syncAccounts } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, id: string, name: string}>({
    show: false,
    id: '',
    name: ''
  });
  const [resetPassword, setResetPassword] = useState<{show: boolean, id: string, name: string, email: string}>({
    show: false,
    id: '',
    name: '',
    email: ''
  });
  const [gradeRestrictions, setGradeRestrictions] = useState<{
    show: boolean, 
    id: string, 
    name: string, 
    gradeLevels: string[]
  }>({
    show: false,
    id: '',
    name: '',
    gradeLevels: []
  });
  const [newPassword, setNewPassword] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAccounts();
      if (response.success) {
        setAccounts(response.data);
      } else {
        console.error('Error loading accounts:', response.error);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSyncAccounts = async () => {
    setIsSyncing(true);
    try {
      await syncAccounts();
      await loadAccounts();
    } catch (error) {
      console.error('Error syncing accounts:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddAccount = () => {
    navigate('/admin/accounts/new');
  };
  
  const handleEditAccount = (id: string) => {
    navigate(`/admin/accounts/${id}`);
  };
  
  const handleDeleteAccount = (id: string, name: string) => {
    setDeleteConfirmation({
      show: true,
      id,
      name
    });
  };
  
  const confirmDelete = async () => {
    try {
      const response = await api.deleteAccount(deleteConfirmation.id);
      if (response.success) {
        // Refresh the accounts list
        const accountsResponse = await api.getAccounts();
        if (accountsResponse.success) {
          setAccounts(accountsResponse.data);
        }
      } else {
        alert(response.error || 'حدث خطأ أثناء حذف الحساب');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('حدث خطأ أثناء حذف الحساب');
    }
    setDeleteConfirmation({ show: false, id: '', name: '' });
  };
  
  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: '', name: '' });
  };
  
  const handleResetPassword = (id: string, name: string, email: string) => {
    setResetPassword({
      show: true,
      id,
      name,
      email
    });
    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-8);
    setNewPassword(randomPassword);
  };
  
  const confirmResetPassword = async () => {
    try {
      const accountResponse = await api.getAccount(resetPassword.id);
      if (accountResponse.success) {
        const account = accountResponse.data;
        const updateResponse = await api.updateAccount(resetPassword.id, {
          ...account,
          password: newPassword
        });
        
        if (updateResponse.success) {
          alert(`تم إعادة تعيين كلمة المرور للحساب ${resetPassword.name}`);
        } else {
          alert(updateResponse.error || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
        }
      } else {
        alert(accountResponse.error || 'حدث خطأ أثناء جلب بيانات الحساب');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('حدث خطأ أثناء إعادة تعيين كلمة المرور');
    }
    
    setResetPassword({ show: false, id: '', name: '', email: '' });
  };
  
  const cancelResetPassword = () => {
    setResetPassword({ show: false, id: '', name: '', email: '' });
    setNewPassword('');
  };
  
  const handleManageGradeRestrictions = (account: Account) => {
    setGradeRestrictions({
      show: true,
      id: account.id,
      name: account.name,
      gradeLevels: account.gradeLevels || []
    });
  };
  
  const handleSaveGradeRestrictions = async (gradeLevels: string[]) => {
    try {
      // Get current account data
      const accountResponse = await api.getAccount(gradeRestrictions.id);
      if (!accountResponse.success) {
        throw new Error(accountResponse.error || 'Failed to get account details');
      }
      
      // Update account with new grade levels
      const account = accountResponse.data;
      const updateResponse = await api.updateAccount(gradeRestrictions.id, {
        ...account,
        gradeLevels
      });
      
      if (updateResponse.success) {
        // Update local state
        setAccounts(accounts.map(acc => 
          acc.id === gradeRestrictions.id 
            ? { ...acc, gradeLevels } 
            : acc
        ));
        
        // Close modal
        setGradeRestrictions({
          show: false,
          id: '',
          name: '',
          gradeLevels: []
        });
      } else {
        alert(updateResponse.error || 'حدث خطأ أثناء تحديث صلاحيات الصفوف');
      }
    } catch (error) {
      console.error('Error saving grade restrictions:', error);
      alert('حدث خطأ أثناء حفظ صلاحيات الصفوف');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'schoolAdmin':
        return 'مدير مدرسة';
      case 'gradeManager':
        return 'مدير صف';
      default:
        return role;
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الحسابات</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSyncAccounts}
            className="btn btn-secondary flex items-center gap-2"
            disabled={isSyncing}
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "جاري المزامنة..." : "مزامنة الحسابات"}</span>
          </button>
          <button
            onClick={handleAddAccount}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>إضافة حساب</span>
          </button>
        </div>
      </div>
      
      {/* Account Sync Status Component */}
      <AccountSyncStatus />
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-gray-800">قائمة الحسابات</h2>
        </div>
        
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد حسابات مسجلة في النظام
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم المستخدم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الدور
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدرسة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر تسجيل دخول
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{account.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{account.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{account.username || account.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {getRoleLabel(account.role)}
                        {account.gradeLevels && account.gradeLevels.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {account.gradeLevels.length > 1 
                              ? `${account.gradeLevels.length} صفوف` 
                              : account.gradeLevels[0]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{account.school}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {account.lastLogin ? new Date(account.lastLogin).toLocaleString('ar-SA') : 'لم يسجل الدخول بعد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEditAccount(account.id)}
                          className="text-primary hover:text-primary-dark"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </button>
                        {account.role === 'gradeManager' && (
                          <button
                            onClick={() => handleManageGradeRestrictions(account)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="إدارة صلاحيات الصفوف"
                          >
                            <Book size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(account.id, account.name, account.email)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id, account.name)}
                          className="text-red-600 hover:text-red-800"
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
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-700 mb-6">
              هل أنت متأكد من حذف حساب <strong>{deleteConfirmation.name}</strong>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="btn btn-outline"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn-danger"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset Password Dialog */}
      {resetPassword.show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">إعادة تعيين كلمة المرور</h3>
            <p className="text-gray-700 mb-4">
              هل أنت متأكد من إعادة تعيين كلمة المرور لحساب <strong>{resetPassword.name}</strong>؟
            </p>
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-1">كلمة المرور الجديدة:</div>
              <div className="flex">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input input-bordered flex-1"
                />
                <button
                  onClick={() => setNewPassword(Math.random().toString(36).slice(-8))}
                  className="btn btn-outline mr-2"
                >
                  توليد
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelResetPassword}
                className="btn btn-outline"
              >
                إلغاء
              </button>
              <button
                onClick={confirmResetPassword}
                className="btn btn-warning"
              >
                تأكيد إعادة التعيين
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Grade Restrictions Modal */}
      {gradeRestrictions.show && (
        <GradeRestrictionsModal 
          userId={gradeRestrictions.id}
          userName={gradeRestrictions.name}
          currentGradeLevels={gradeRestrictions.gradeLevels}
          onClose={() => setGradeRestrictions({
            show: false,
            id: '',
            name: '',
            gradeLevels: []
          })}
          onSave={handleSaveGradeRestrictions}
        />
      )}
    </div>
  );
};

export default AccountsList;
 