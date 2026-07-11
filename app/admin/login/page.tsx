import { LoginForm } from '@/components/auth/LoginForm';
import { loginAdmin } from '@/lib/auth/login-action';

export default function AdminLoginPage() {
  return <LoginForm action={loginAdmin} title="WACOSE Admin" />;
}
