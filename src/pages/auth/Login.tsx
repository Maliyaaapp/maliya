import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { School } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(emailOrUsername, password);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-primary text-white p-3 rounded-full">
              <School size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary">نظام إدارة مالية المدارس</h1>
          <p className="text-gray-600 mt-2">سلطنة عمان</p>
          <p className="text-gray-600 mt-1">سجّل دخولك للوصول إلى لوحة التحكم</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="emailOrUsername">
              البريد الإلكتروني أو اسم المستخدم
            </label>
            <input
              id="emailOrUsername"
              type="text"
              className="input"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
 