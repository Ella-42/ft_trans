import { renderHomePage } from "./src/pages/HomePage.js";
import { renderCookiePolicy } from "./src/pages/CookiePolicy.js";
import { renderLogin } from "./src/pages/Login.js";
import { renderRegister } from "./src/pages/Register.js";
import { attachRegisterFormListener } from './src/pages/Register.js';
import { attachLoginFormListener } from './src/pages/Login.js';
import { renderDashboard } from './src/pages/Dashboard.js';
import { attachDashboardListener } from './src/pages/Dashboard.js'
import { getCookie } from './src/tools/helper.js'

declare const axios: any;

const routes: { [key: string]: () => string } = {
    "/safe": renderHomePage,
    "/safe/login": renderLogin,
    "/safe/cookie-policy": renderCookiePolicy,
    "/safe/register": renderRegister,

};

export const navigateTo = (url: string) => {
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

    if (path === "/safe/dashboard") {
	try {
		const res = await axios.get('https://trans.ella-peeters.me/api/users/verifytoken', {
			withCredentials: true
		});
		console.log("The response in dashboard  is: ", res);
		if (res.data.message === 'OK') {
			const user = res.data;
			console.log("The user is: ", user);
			const page = renderDashboard(user);
			app.innerHTML = page;
            		attachLoggedInMenuListener();
			attachDashboardListener();
			attachLogoutListener();
        		return;
		}
	}
	catch (error) {
		console.error('Token verification failed: ', error);
		navigateTo('/safe/login');
		return ;
	}
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
	console.log("The menu button: ", mobileMenuButton);
	const mobileMenu = document.querySelector(".navigation-menu");
	console.log("The mobile menu is: ", mobileMenu);
	console.log("The listener function for the menu runs");

	mobileMenuButton.addEventListener("click", () => {
			if (mobileMenu)
				mobileMenu.classList.toggle("hidden");
	})
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
	})
};

const attachLogoutListener = async () => {
	console.log("The logout listener runs");
	const logoutButton = document.querySelector("#logout-btn");
	console.log("The logout button is: ", logoutButton);
	logoutButton.addEventListener("click", async () => {
		try {
			await axios.post('https://trans.ella-peeters.me/api/logout');
			navigateTo('/safe');
		} catch (error)	{
			console.error("The error is: ", error);
		}
	})
}
//const attachRegisterFormListener = () => {
//	const registerForm = document.querySelector("#registerForm");
//	console.log("The listener function for the form runs");
//	registerForm.addEventListener('submit', (event) => {
//		event.preventDefault();
//		console.log("The event listener for the form is added");
//	});
//};
