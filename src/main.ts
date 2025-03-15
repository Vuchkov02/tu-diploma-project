import { createApp } from "vue";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import "vuetify/styles";
import router from "./router";
import { auth } from "@/plugins/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Create Vuetify instance
const vuetify = createVuetify();

// Track user authentication changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ User logged in:", user.displayName );
    router.push("/lobby"); // Redirect to lobby after login
  } else {
    console.log("❌ No user logged in");
    router.push("/"); // Redirect to home page when logged out
  }
});

// Create and mount Vue app
const app = createApp(App);
app.use(vuetify);
app.use(router);
app.mount("#app");
