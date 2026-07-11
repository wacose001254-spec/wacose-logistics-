'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import type { LoginState } from '@/lib/auth/login-action';

export function LoginForm({
  action,
  title,
}: {
  action: (prevState: LoginState, formData: FormData) => Promise<LoginState>;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Image src="/icons/icon-512.png" alt="" width={72} height={72} className="mx-auto mb-4" />
      <form action={formAction} className="space-y-4 rounded-lg border-t-4 border-brand-gold p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-brand-navy">{title}</h1>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded border px-3 py-2 text-base"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border px-3 py-2 text-base"
          />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-brand-navy py-2 text-base font-medium text-white hover:bg-brand-navy-dark disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
