import { initializeFirebase, getFirebaseDb, isFirestoreAvailable } from './firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

let inited = false;

async function ensureInit() {
  if (inited && isFirestoreAvailable()) return;
  try {
    initializeFirebase();
    inited = true;
  } catch (e) {
    console.error('Failed to init Firebase in profileService:', e);
    throw e;
  }
}

export function getOrCreateUserId() {
  try {
    const key = 'fb_user_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() || `uid_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    // SSR or storage disabled
    return `uid_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  }
}

export async function saveProfiles(userInput, agentProfiles, userIdOptional) {
  await ensureInit();
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not available');

  const userId = userIdOptional || getOrCreateUserId();
  const payload = {
    userInput,
    agentProfiles,
    createdAt: serverTimestamp(),
    userId,
    // quick denormalized fields for filtering
    age_range: userInput?.demographics?.age_range || null,
    gender: userInput?.demographics?.gender || null,
    liked_genres: userInput?.interests?.liked_genres || [],
  };

  const ref = await addDoc(collection(db, 'agent_profiles'), payload);
  return ref.id;
}

export async function getProfilesById(profileId) {
  await ensureInit();
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not available');
  const snapshot = await getDoc(doc(db, 'agent_profiles', profileId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}
