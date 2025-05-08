import  { Bell, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resetAllData } from '../../services/dataStore';
import { useState } from 'react';

const Header = () => {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setIsResetting(true);
    try {
      resetAllData();
      alert('تم مسح جميع البيانات بنجاح. سيتم تحديث الصفحة الآن.');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('حدث خطأ أثناء مسح البيانات');
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 z-30">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-gray-600 cursor-pointer" />
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-2 rounded-full">
              <User size={16} />
            </div>
            <span className="font-medium">{user?.name}</span>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={handleResetClick}
              disabled={isResetting || showResetConfirm}
              className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
            >
              <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
              مسح جميع البيانات
            </button>
          )}
        </div>
        <div className="text-2xl font-bold text-primary">نظام إدارة مالية المدارس - سلطنة عمان</div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">تأكيد مسح البيانات</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من رغبتك في مسح جميع بيانات النظام؟ لا يمكن التراجع عن هذه العملية وسيتم حذف جميع المدارس والحسابات والطلاب والرسوم.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelReset}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmReset}
                disabled={isResetting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {isResetting ? 'جاري المسح...' : 'تأكيد المسح'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
 