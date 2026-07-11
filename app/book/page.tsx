import { BookingForm } from '@/components/booking/BookingForm';

export default function BookPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Book a pickup</h1>
      <BookingForm />
    </div>
  );
}
