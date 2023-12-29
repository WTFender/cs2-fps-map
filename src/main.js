import { createApp } from 'vue'
import App from './App.vue'
import VuePapaParse from 'vue-papa-parse'
import OpenLayersMap from "vue3-openlayers";
import VueDiff from 'vue-diff';
import 'vue-diff/dist/index.css';

const app = createApp(App);
app.use(OpenLayersMap, { debug: true, });
app.use(VuePapaParse);
app.use(VueDiff);

app.mount("#app");