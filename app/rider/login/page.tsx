import { LoginForm } from '@/components/auth/LoginForm';
import { loginRider } from '@/lib/auth/login-action';

export default function RiderLoginPage() {
  return <LoginForm action={loginRider} title="WACOSE Rider" />;
}
