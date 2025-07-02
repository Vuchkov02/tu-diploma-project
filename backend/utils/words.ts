import { initializeFirebase, firestore } from "../firebase/init.js";
import { WordPools } from "../types/index.js";

initializeFirebase();

export async function loadWordsForLanguage(lang: string, wordPools: WordPools): Promise<string[]> {
  const db = firestore(); 

  if (wordPools[lang]) return wordPools[lang];

  const doc = await db.collection("words").doc(`words-${lang}`).get();
  if (!doc.exists) throw new Error(`❌ No word list for language: ${lang}`);

  const data = doc.data();
  if (!data || !data.words) {
    throw new Error(`❌ Invalid word data for language: ${lang}`);
  }

  const words = data.words as string[];
  wordPools[lang] = words;
  return words;
} 