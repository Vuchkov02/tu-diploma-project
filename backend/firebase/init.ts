import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let isInitialized = false;

export function initializeFirebase(): void {
  if (isInitialized || admin.apps.length) return;

  const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../firebase-key.json"), "utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  isInitialized = true;
  console.log("Firebase Admin инициализиран");
}

export function firestore(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error("Firebase не е инициализиран");
  }
  return admin.firestore();
} 