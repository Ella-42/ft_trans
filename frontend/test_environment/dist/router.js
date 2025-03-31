import { renderHomePage } from "./src/pages/HomePage.js";
import { renderCookiePolicy } from "./src/pages/CookiePolicy.js";
import { renderLogin } from "./src/pages/Login.js";
const routes = {
    "/safe": renderHomePage,
    "/safe/login": renderLogin,
    "/safe/cookie-policy": renderCookiePolicy,
};
export const navigateTo = (url) => {
    history.pushState({}, "", url);
    router(); // Re-render the page
};
export const router = () => {
    console.log("🚀 Router function is running!");
    const path = window.location.pathname;
    console.log("The current path is:", path);
    const app = document.getElementById("app");
    if (!app) {
        console.error("❌ ERROR: <div id='app'> NOT FOUND!");
        return;
    }
    const page = routes[path] ? routes[path]() : "<h1>404 - Page Not Found</h1>";
    app.innerHTML = page;
};
// Handle browser back/forward navigation
window.addEventListener("popstate", router);
