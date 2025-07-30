import { renderHomePage } from "./src/pages/HomePage.js";
import { renderCookiePolicy } from "./src/pages/CookiePolicy.js";
import { renderPrivacyPolicy } from "./src/pages/PrivacyPolicy.js";
import { renderTermsAndConditions } from "./src/pages/TermsAndConditions.js";
import { renderLogin } from "./src/pages/Login.js";
import { renderRegister } from "./src/pages/Register.js";
import { attachRegisterFormListener } from './src/pages/Register.js';
import { attachLoginFormListener } from './src/pages/Login.js';
import { renderDashboardComponent } from './src/components/DashboardComponent.js';
import { renderDashboard } from './src/pages/Dashboard.js';
import { renderProfile } from './src/components/ProfileComponent.js';
import { renderMatchmaking } from './src/components/MatchmakingComponent.js';
import { renderTournament } from './src/components/TournamentComponent.js';
import { renderStats } from './src/components/StatsComponent.js';
import { attachDashboardListener } from './src/pages/Dashboard.js';
import { attachUpdateProfileFormListener } from './src/components/ProfileComponent.js';
const routes = {
    "/safe": renderHomePage,
    "/safe/login": renderLogin,
    "/safe/cookie-policy": renderCookiePolicy,
    "/safe/privacy-policy": renderPrivacyPolicy,
    "/safe/terms-and-conditions": renderTermsAndConditions,
    "/safe/register": renderRegister,
};
const dashboardRoutes = {
    "/safe/dashboard": (user) => renderDashboardComponent(user),
    "/safe/dashboard/matchmaking": () => renderMatchmaking(),
    "/safe/dashboard/tournament": () => renderTournament(),
    "/safe/dashboard/profile": () => renderProfile(),
    "/safe/dashboard/stats": () => renderStats(),
};
export const navigateTo = (url) => {
    history.pushState({}, "", url);
    router(); // Re-render the page
};
export const router = async () => {
    console.log("🚀 Router function is running!");
    const path = window.location.pathname;
    console.log("The current path is:", path);
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
                // Inject only the inner page
                const innerContent = dashboardRoutes[path];
                if (innerContent) {
                    document.getElementById("dashboard-content").innerHTML = innerContent(user);
                    if (path === "/safe/dashboard/profile") {
                        attachUpdateProfileFormListener();
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
    //setTimeout(attachMenuListener, 0);
    //setTimeout(attachRegisterFormListener, 0);
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
    console.log("The menu button: ", mobileMenuButton);
    const mobileMenu = document.querySelector(".navigation-menu");
    console.log("The mobile menu is: ", mobileMenu);
    console.log("The listener function for the menu runs");
    mobileMenuButton.addEventListener("click", () => {
        if (mobileMenu)
            mobileMenu.classList.toggle("hidden");
    });
};
const attachLoggedInMenuListener = () => {
    const mobileMenuButtonLoggedIn = document.querySelector(".mobile-menu-button-logged-in");
    console.log("The menu button: ", mobileMenuButtonLoggedIn);
    const mobileMenuLoggedIn = document.querySelector(".navigation-menu-logged-in");
    console.log("The mobile menu is: ", mobileMenuLoggedIn);
    console.log("The listener function for the logged in menu runs");
    mobileMenuButtonLoggedIn.addEventListener("click", () => {
        if (mobileMenuLoggedIn)
            mobileMenuLoggedIn.classList.toggle("hidden");
    });
};
const attachLogoutListener = async () => {
    console.log("The logout listener runs");
    const logoutButton = document.querySelector("#logout-btn");
    console.log("The logout button is: ", logoutButton);
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
    console.log("The listener for the active links runs");
    const links = document.querySelectorAll('.sidebar-link');
    const currentPath = window.location.pathname;
    console.log("The links: ", links);
    console.log("The current path is: ", currentPath);
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
//const attachRegisterFormListener = () => {
//	const registerForm = document.querySelector("#registerForm");
//	console.log("The listener function for the form runs");
//	registerForm.addEventListener('submit', (event) => {
//		event.preventDefault();
//		console.log("The event listener for the form is added");
//	});
//};
