'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function CashFlowChart({ data }: { data: { stage: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="stage" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(value) => [`KES ${value}`, 'Amount']} />
        <Bar dataKey="amount" fill="#111827" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
