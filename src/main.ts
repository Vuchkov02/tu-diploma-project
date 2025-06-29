import { createApp } from "vue";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import "vuetify/styles";
import router from "./router";
import { auth } from "@/plugins/firebase";
import { onAuthStateChanged } from "firebase/auth";

const vuetify = createVuetify({
  theme: {
    defaultTheme: "myCustomTheme",
    themes: {
      myCustomTheme: {
        dark: true, 
        colors: {
          background: "#1E1D26", 
          surface: "#1E1D26", 
          primary: "#94F8D0", 
          secondary: "#C99CFF", 
          onPrimary: "#000000", 
          onSecondary: "#1E1D26", 
          onBackground: "#FFFFFF", 
          onSurface: "#FFFFFF",
        },
        variables: {
          "font-family-base": "DynaPuff",
        },
      },
    },
  },
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await user.reload();

    console.log("✅ User logged in:", user.displayName || "No displayName yet");
    router.push("/lobby");
  } else {
    console.log("❌ No user logged in");
    router.push("/"); 
  }
});

const app = createApp(App);
app.use(vuetify);
app.use(router);
app.mount("#app");
