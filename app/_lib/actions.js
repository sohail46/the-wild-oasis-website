'use server';

import { auth, signIn, signOut } from '@/app/_lib/auth';
import { supabase } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';

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
