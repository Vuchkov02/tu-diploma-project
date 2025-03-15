import { createApp } from "vue";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import "vuetify/styles";
import router from "./router";
import { auth } from "@/plugins/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Create Vuetify instance
const vuetify = createVuetify({
  theme: {
    defaultTheme: "myCustomTheme",
    themes: {
      myCustomTheme: {
        dark: false, // Set to true if using dark mode
        colors: {}, // Define theme colors if needed
        variables: {
          "font-family-base": "Bangers, cursive",
        },
      },
    },
  },
});

// Track user authentication changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await user.reload(); // 🔄 Ensures we fetch the latest user info

    console.log("✅ User logged in:", user.displayName || "No displayName yet");
    router.push("/lobby"); // Redirect to lobby
  } else {
    console.log("❌ No user logged in");
    router.push("/"); // Redirect to home page
  }
});

// Create and mount Vue app
const app = createApp(App);
app.use(vuetify);
app.use(router);
app.mount("#app");
