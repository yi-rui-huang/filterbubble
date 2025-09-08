import { initializeFirebase, getFirebaseDb, isFirestoreAvailable } from './firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

let inited = false;

async function ensureInit() {
  if (inited && isFirestoreAvailable()) return;
  initializeFirebase();
  inited = true;
}

export async function saveRecommendedMovies(userId, profileId, movies) {
  await ensureInit();
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not available');

  const payload = {
    userId,
    profileId,
    createdAt: serverTimestamp(),
    count: Array.isArray(movies) ? movies.length : 0,
    movies,
  };

  const ref = await addDoc(collection(db, 'recommended_movie_sets'), payload);
  return ref.id;
}

export async function getRecommendedMoviesByProfile(profileId) {
  await ensureInit();
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not available');
  const snapshot = await getDoc(doc(db, 'recommended_movie_sets', profileId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}
