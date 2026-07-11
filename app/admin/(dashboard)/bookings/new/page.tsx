import { BookingForm } from '@/components/booking/BookingForm';

export default function AdminNewBookingPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold">New booking (phone order)</h1>
      <BookingForm redirectTo="admin" />
    </div>
  );
}
