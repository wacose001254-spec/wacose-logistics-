'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function RevenueChart({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(value) => [`KES ${value}`, 'Revenue']} />
        <Bar dataKey="revenue" fill="#111827" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
