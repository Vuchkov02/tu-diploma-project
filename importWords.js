import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ⛏️ Симулиране на __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Зареждане на service account JSON
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "firebase-key.json"), "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importWordsFromFile(filePath, docId) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { words } = JSON.parse(fileContent);

  if (!Array.isArray(words)) {
    console.error(`❌ Няма 'words' масив в ${filePath}`);
    return;
  }

  const docRef = db.collection("words").doc(docId);
  await docRef.set({ words });

  console.log(`✅ Качени думи от ${filePath} в '${docId}'`);
}

async function main() {
  try {
    const basePath = path.join(__dirname, "resources");

    await importWordsFromFile(path.join(basePath, "words-english.json"), "words-english");
    await importWordsFromFile(path.join(basePath, "words-bulgarian.json"), "words-bulgarian");

    console.log("🎉 Всичко е качено успешно!");
  } catch (err) {
    console.error("🔥 Грешка при импорта:", err);
  }
}

main();
