import { initializeFirebase, firestore } from "../firebase/init.js";

initializeFirebase();

export async function loadWordsForLanguage(lang, wordPools) {
  const db = firestore(); // 🧠 взимаме инстанцията след init

  if (wordPools[lang]) return wordPools[lang];

  const doc = await db.collection("words").doc(`words-${lang}`).get();
  if (!doc.exists) throw new Error(`❌ No word list for language: ${lang}`);

  const words = doc.data().words;
  wordPools[lang] = words;
  return words;
}
