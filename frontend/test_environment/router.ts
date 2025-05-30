import { renderHomePage } from "./src/pages/HomePage.js";
import { renderCookiePolicy } from "./src/pages/CookiePolicy.js";
import { renderLogin } from "./src/pages/Login.js";
import { renderRegister } from "./src/pages/Register.js";
import { attachRegisterFormListener } from './src/pages/Register.js';
import { attachLoginFormListener } from './src/pages/Login.js';
import { renderDashboard } from './src/pages/Dashboard.js';

const routes: { [key: string]: () => string } = {
    "/safe": renderHomePage,
    "/safe/login": renderLogin,
    "/safe/cookie-policy": renderCookiePolicy,
    "/safe/register": renderRegister,
    "/safe/dashboard": renderDashboard,
};

export const navigateTo = (url: string) => {
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

    //setTimeout(attachMenuListener, 0);
    //setTimeout(attachRegisterFormListener, 0);

    const page = routes[path] ? routes[path]() : "<h1>404 - Page Not Found</h1>";
    app.innerHTML = page;

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
	console.log("The listener function for the menu runs");

	mobileMenuButton.addEventListener("click", () => {
			if (mobileMenu)
				mobileMenu.classList.toggle("hidden");
	})
};

//const attachRegisterFormListener = () => {
//	const registerForm = document.querySelector("#registerForm");
//	console.log("The listener function for the form runs");
//	registerForm.addEventListener('submit', (event) => {
//		event.preventDefault();
//		console.log("The event listener for the form is added");
//	});
//};
