import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { checkAccountSyncStatus, fixAccountSyncIssues, SyncStatusResponse, FixResult } from '../utils/accountUtils';

const AccountSyncStatus: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fixing, setFixing] = useState<boolean>(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);

  const loadSyncStatus = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await checkAccountSyncStatus();
      setStatus(result);
    } catch (error) {
      console.error('Error checking sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixIssues = async (): Promise<void> => {
    setFixing(true);
    try {
      const result = await fixAccountSyncIssues();
      setFixResult(result);
      // Refresh the status after fixing
      await loadSyncStatus();
    } catch (error) {
      console.error('Error fixing sync issues:', error);
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    loadSyncStatus();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">حالة مزامنة الحسابات</h2>
        <button 
          onClick={loadSyncStatus} 
          className="btn btn-sm btn-outline"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="mr-1">تحديث</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <RefreshCw size={24} className="animate-spin text-primary" />
        </div>
      ) : status?.success ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">الحسابات المحلية</div>
              <div className="text-xl font-bold">{status.data?.totalLocalAccounts}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">حسابات Appwrite</div>
              <div className="text-xl font-bold">{status.data?.totalAppwriteAccounts}</div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-1 text-sm">حالة المزامنة:</div>
            <div className="flex items-center">
              {status.data?.isSynced ? (
                <>
                  <CheckCircle size={18} className="text-green-500 ml-1" />
                  <span className="text-green-600 font-medium">متزامن</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-red-500 ml-1" />
                  <span className="text-red-600 font-medium">غير متزامن</span>
                </>
              )}
            </div>
          </div>

          {status.data && !status.data.isSynced && (
            <div className="space-y-3 mt-4">
              <div className="text-sm font-medium">تفاصيل عدم التزامن:</div>
              {status.data.localOnlyAccounts.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="flex items-center text-sm text-yellow-800">
                    <AlertTriangle size={16} className="ml-1" />
                    <span>{status.data.localOnlyAccounts.length} حساب موجود محليًا غير موجود في Appwrite</span>
                  </div>
                  <ul className="mt-2 text-xs text-gray-600 space-y-1">
                    {status.data.localOnlyAccounts.map(acc => (
                      <li key={acc.id}>• {acc.name || 'بدون اسم'} ({acc.email})</li>
                    ))}
                  </ul>
                </div>
              )}

              {status.data.appwriteOnlyAccounts.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center text-sm text-blue-800">
                    <AlertTriangle size={16} className="ml-1" />
                    <span>{status.data.appwriteOnlyAccounts.length} حساب موجود في Appwrite غير موجود محليًا</span>
                  </div>
                  <ul className="mt-2 text-xs text-gray-600 space-y-1">
                    {status.data.appwriteOnlyAccounts.map(acc => (
                      <li key={acc.id}>• {acc.name || 'بدون اسم'} ({acc.email})</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleFixIssues}
                className="btn btn-primary w-full mt-3"
                disabled={fixing}
              >
                {fixing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin ml-1" />
                    <span>جاري إصلاح مشاكل المزامنة...</span>
                  </>
                ) : (
                  <span>إصلاح مشاكل المزامنة</span>
                )}
              </button>

              {fixResult && (
                <div className="mt-3 text-sm">
                  {fixResult.success ? (
                    <div className="text-green-600">
                      <div>تم إصلاح {(fixResult.data?.fixedLocalAccounts.length || 0) + (fixResult.data?.fixedAppwriteAccounts.length || 0)} حساب</div>
                      {fixResult.data?.errors.length ? (
                        <div className="text-yellow-600 mt-1">
                          هناك {fixResult.data.errors.length} مشاكل لم يتم إصلاحها
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-red-600">
                      حدث خطأ أثناء محاولة الإصلاح: {fixResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-red-600 py-3">
          {status?.error || "حدث خطأ أثناء التحقق من حالة المزامنة"}
        </div>
      )}
    </div>
  );
};

export default AccountSyncStatus; 