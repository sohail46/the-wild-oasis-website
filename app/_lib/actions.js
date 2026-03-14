'use server';

import { auth, signIn, signOut } from '@/app/_lib/auth';
import { supabase } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import { getBookings } from './data-service';
import { redirect } from 'next/navigation';

function isValidNationalID(nationalID) {
  const nationalIdRegex = /^[a-zA-Z0-9]{6,12}$/;
  return nationalIdRegex.test(nationalID);
}

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const nationalID = formData.get('nationalID');
  const [nationality, countryFlag] = formData.get('nationality').split('%');

  if (!isValidNationalID(nationalID))
    throw new Error('Please provide a valid National ID.');

  const updateData = { nationality, countryFlag, nationalID };

  const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', session.user.guestId);

  if (error) throw new Error('Guest could not be updated');

  revalidatePath('/account/profile');

  return data;
}

export async function signInAction() {
  return signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You can only delete your own reservations.');

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) throw new Error('Reservation could not be deleted');

  revalidatePath('/account/reservations');
}

export async function updateBooking(formData) {
  // 1. authentication user
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  // authorization
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);
  const bookingId = Number(formData.get('bookingId'));

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You can only edit your own bookings.');

  // build updatedFields object from formData
  const updatedFields = {
    numGuests: formData.get('numGuests'),
    observations: formData.get('observations').slice(0, 1000), // Limit observations to 1000 chars
  };

  // mutation
  const { error } = await supabase
    .from('bookings')
    .update(updatedFields)
    .eq('id', bookingId);

  // error handling
  if (error) {
    console.error(error);
    throw new Error('Booking could not be updated');
  }

  // revalidate and redirect
  revalidatePath('/account/reservations');
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  redirect('/account/reservations');
}
