'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { VEHICLE_TYPES, VEHICLE_STATUSES, type VehicleType, type VehicleStatus } from '@/lib/constants';

export interface VehicleActionState {
  error?: string;
}

export async function addVehicleAction(_prevState: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  const plateNumber = String(formData.get('plateNumber') ?? '').trim();
  const type = String(formData.get('type') ?? '');

  if (!plateNumber || !VEHICLE_TYPES.includes(type as (typeof VEHICLE_TYPES)[number])) {
    return { error: 'Enter a plate number and select a vehicle type.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('vehicles').insert({ plate_number: plateNumber, type: type as VehicleType });
  if (error) {
    return { error: error.code === '23505' ? 'That plate number is already registered.' : 'Could not add vehicle.' };
  }

  revalidatePath('/admin/fleet');
  return {};
}

export async function updateVehicleStatusAction(vehicleId: string, status: string) {
  if (!VEHICLE_STATUSES.includes(status as (typeof VEHICLE_STATUSES)[number])) return;
  const supabase = await createClient();
  await supabase.from('vehicles').update({ status: status as VehicleStatus }).eq('id', vehicleId);
  revalidatePath('/admin/fleet');
}

export async function assignRiderToVehicleAction(riderId: string, vehicleId: string) {
  const supabase = await createClient();
  // End any current assignment for this rider or vehicle before starting a new one.
  await supabase.from('rider_vehicle_assignments').update({ unassigned_at: new Date().toISOString() }).eq('rider_id', riderId).is('unassigned_at', null);
  await supabase.from('rider_vehicle_assignments').update({ unassigned_at: new Date().toISOString() }).eq('vehicle_id', vehicleId).is('unassigned_at', null);
  await supabase.from('rider_vehicle_assignments').insert({ rider_id: riderId, vehicle_id: vehicleId });
  revalidatePath('/admin/fleet');
  revalidatePath('/admin/riders');
}
