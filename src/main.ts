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
        dark: true, // ✅ Включваме тъмния режим
        colors: {
          background: "#1E1D26", // 🖤 Тъмно сиво
          surface: "#1E1D26", // 🖤 Също за компоненти като карти
          primary: "#94F8D0", // 💚 Ментово зелено
          secondary: "#C99CFF", // 💜 Светло лилаво
          onPrimary: "#000000", // Черен текст върху ментово
          onSecondary: "#1E1D26", // Тъмен текст върху лилаво
          onBackground: "#FFFFFF", // Бял текст на тъмен фон
          onSurface: "#FFFFFF",
        },
        variables: {
          "font-family-base": "DynaPuff",
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
