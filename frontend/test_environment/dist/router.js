import { renderHomePage } from "./src/pages/HomePage.js";
import { renderCookiePolicy } from "./src/pages/CookiePolicy.js";
import { renderPrivacyPolicy } from "./src/pages/PrivacyPolicy.js";
import { renderTermsAndConditions } from "./src/pages/TermsAndConditions.js";
import { renderLogin, attachLoginFormListener } from "./src/pages/Login.js";
import { renderRegister, attachRegisterFormListener } from "./src/pages/Register.js";
import { renderDashboard, attachDashboardListener } from './src/pages/Dashboard.js';
import { renderSettings, attachSettingsListener } from './src/components/SettingsComponent.js';
import { renderPlayNow, attachPlayNowPong } from './src/components/PlayNowComponent.js';
import { renderMatchmaking, attachMatchmakingPong } from './src/components/MatchmakingComponent.js';
import { renderTournament, attachTournamentPong } from './src/components/TournamentComponent.js';
import { renderStats, attachStatsListener } from './src/components/StatsComponent.js';
import { attachFriendsListener } from './src/components/FriendsComponent.js';
import { attachProfileListener, renderProfile } from './src/components/ProfileComponent.js';
const routes = {
    "/safe": renderHomePage,
    "/safe/login": renderLogin,
    "/safe/cookie-policy": renderCookiePolicy,
    "/safe/privacy-policy": renderPrivacyPolicy,
    "/safe/terms-and-conditions": renderTermsAndConditions,
    "/safe/register": renderRegister,
};
const dashboardRoutes = {
    "/safe/dashboard/profile": () => renderProfile(),
    "/safe/dashboard/play": () => renderPlayNow(),
    "/safe/dashboard/matchmaking": () => renderMatchmaking(),
    "/safe/dashboard/tournament": () => renderTournament(),
    "/safe/dashboard/settings": () => renderSettings(),
    "/safe/dashboard/stats": () => renderStats(),
    "/safe/dashboard/friends": () => "",
};
export const navigateTo = (url) => {
    window.pongClean?.();
    window.pongClean = null;
    history.pushState({}, "", url);
    router(); // Re-render the page
};
export const router = async () => {
    const path = window.location.pathname;
    const app = document.getElementById("app");
    if (!app) {
        console.error("❌ ERROR: <div id='app'> NOT FOUND!");
        return;
    }
    if (path.startsWith("/safe/dashboard")) {
        try {
            const res = await axios.get('https://trans.ella-peeters.me/api/users/verifytoken', {
                withCredentials: true
            });
            if (res.data.message === "OK") {
                const user = res.data;
                // If dashboard already rendered, just update content
                if (!document.getElementById("dashboard-content")) {
                    app.innerHTML = renderDashboard(user); // First full layout render
                    attachLoggedInMenuListener();
                    attachDashboardListener();
                    attachLogoutListener();
                }
                attachSideBarActiveLinkListener();
                if (path.startsWith("/safe/dashboard/profile/")) {
                    document.getElementById("dashboard-content").innerHTML = renderProfile();
                    const userIdFromPath = path.split("/").pop();
                    attachProfileListener(Number(userIdFromPath));
                    return;
                }
                // Inject only the inner page
                const innerContent = dashboardRoutes[path];
                if (innerContent) {
                    document.getElementById("dashboard-content").innerHTML = innerContent(user);
                    if (path === "/safe/dashboard/profile") {
                        attachProfileListener(null);
                    }
                    else if (path === "/safe/dashboard/play") {
                        attachPlayNowPong();
                    }
                    else if (path === "/safe/dashboard/matchmaking") {
                        attachMatchmakingPong();
                    }
                    else if (path === "/safe/dashboard/tournament") {
                        attachTournamentPong();
                    }
                    else if (path === "/safe/dashboard/settings") {
                        attachSettingsListener();
                    }
                    else if (path === "/safe/dashboard/stats") {
                        attachStatsListener();
                    }
                    else if (path === "/safe/dashboard/friends") {
                        attachFriendsListener();
                    }
                }
                else {
                    document.getElementById("dashboard-content").innerHTML = `<p>404 - Page not found in dashboard</p>`;
                }
                return;
            }
        }
        catch (error) {
            console.error('Token verification failed: ', error);
            navigateTo('/safe/login');
            return;
        }
    }
    const page = routes[path] ? routes[path]() : "<h1>404 - Page Not Found</h1>";
    app.innerHTML = await page;
    attachMenuListener();
    if (path === "/safe/register")
        attachRegisterFormListener();
    if (path === "/safe/login")
        attachLoginFormListener();
};
// Handle browser back/forward navigation
window.addEventListener("popstate", router);
const attachMenuListener = () => {
    const mobileMenuButton = document.querySelector(".mobile-menu-button");
    const mobileMenu = document.querySelector(".navigation-menu");
    mobileMenuButton.addEventListener("click", () => {
        if (mobileMenu)
            mobileMenu.classList.toggle("hidden");
    });
};
const attachLoggedInMenuListener = () => {
    const mobileMenuButtonLoggedIn = document.querySelector(".mobile-menu-button-logged-in");
    const mobileMenuLoggedIn = document.querySelector(".navigation-menu-logged-in");
    mobileMenuButtonLoggedIn.addEventListener("click", () => {
        if (mobileMenuLoggedIn)
            mobileMenuLoggedIn.classList.toggle("hidden");
    });
};
const attachLogoutListener = async () => {
    const logoutButton = document.querySelector("#logout-btn");
    logoutButton.addEventListener("click", async () => {
        try {
            await axios.post('https://trans.ella-peeters.me/api/logout');
            navigateTo('/safe');
        }
        catch (error) {
            console.error("The error is: ", error);
        }
    });
};
const attachSideBarActiveLinkListener = () => {
    const links = document.querySelectorAll('.sidebar-link');
    const currentPath = window.location.pathname;
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('bg-primary', 'rounded');
        }
        else {
            link.classList.remove('bg-primary', 'rounded');
        }
    });
};
