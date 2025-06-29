import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../firebase-key.json"), "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importWordsFromFile(filePath, docId) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { words } = JSON.parse(fileContent);

  if (!Array.isArray(words)) {
    console.error(`No 'words' array in ${filePath}`);
    return;
  }

  const docRef = db.collection("words").doc(docId);
  await docRef.set({ words });

  console.log(`Imported words from ${filePath} in '${docId}'`);
}

async function main() {
  try {
    const basePath = path.join(__dirname, "../../resources");

    await importWordsFromFile(path.join(basePath, "words-english.json"), "words-english");
    await importWordsFromFile(path.join(basePath, "words-bulgarian.json"), "words-bulgarian");

    console.log("Everything is up");
  } catch (err) {
    console.error("Error importing:", err);
  }
}

main();
