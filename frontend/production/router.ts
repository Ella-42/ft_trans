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
import { renderFriends, attachFriendsListener } from './src/components/FriendsComponent.js';
import { getCookie } from './src/tools/helper.js';
import { attachProfileListener, renderProfile } from './src/components/ProfileComponent.js';

declare const axios: any;

const routes: { [key: string]: () => string | Promise<string> } = {
	"/": renderHomePage,
	"/login": renderLogin,
	"/cookie-policy": renderCookiePolicy,
	"/privacy-policy": renderPrivacyPolicy,
	"/terms-and-conditions": renderTermsAndConditions,
	"/register": renderRegister,
};

const dashboardRoutes: { [key: string]: (user: any) => string } = {
	"/dashboard/profile": () => renderProfile(),
	"/dashboard/play": () => renderPlayNow(),
	"/dashboard/matchmaking": () => renderMatchmaking(),
	"/dashboard/tournament": () => renderTournament(),
	"/dashboard/settings": () => renderSettings(),
	"/dashboard/stats": () => renderStats(),
	"/dashboard/friends": () => "",
};

export const navigateTo = (url: string) => {
	(window as any).pongClean?.();
	(window as any).pongClean = null;
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

    if (path.startsWith("/dashboard")) {
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

				if (path.startsWith("/dashboard/profile/")) {
					document.getElementById("dashboard-content").innerHTML = renderProfile();
					const userIdFromPath = path.split("/").pop();
					attachProfileListener(Number(userIdFromPath));
					return;
				}
        		// Inject only the inner page
        		const innerContent = dashboardRoutes[path];
        		if (innerContent) {
          			document.getElementById("dashboard-content").innerHTML = innerContent(user);
					if (path === "/dashboard/profile")
					{
						attachProfileListener(null);
					}
					else if (path === "/dashboard/play")
					{
						attachPlayNowPong();
					}
					else if (path === "/dashboard/matchmaking")
					{
						attachMatchmakingPong();
					}
					else if (path === "/dashboard/tournament")
					{
						attachTournamentPong();
					}
					else if (path === "/dashboard/settings")
					{
						attachSettingsListener();
					}
					else if (path === "/dashboard/stats")
					{
						attachStatsListener();
					}
					else if (path === "/dashboard/friends")
					{
						attachFriendsListener();
					}
        		} else {
          			document.getElementById("dashboard-content").innerHTML = `<p>404 - Page not found in dashboard</p>`;
        		}
        		return;
      		}

	} catch (error) {
		console.error('Token verification failed: ', error);
		navigateTo('/login');
		return ;
	}
    }

    const page = routes[path] ? routes[path]() : "<h1>404 - Page Not Found</h1>";
    app.innerHTML = await page;

    attachMenuListener();
    attachLogoutListener();

    if (path === "/register")
	    attachRegisterFormListener();
    if (path === "/login")
	    attachLoginFormListener();

    const hash = window.location.hash;
	if (hash) {
		const element = document.querySelector(hash);
		if (element) element.scrollIntoView({ behavior: 'smooth' });
	}
};

// Handle browser back/forward navigation
window.addEventListener("popstate", router);

const attachMenuListener = () => {
	const mobileMenuButton = document.querySelector(".mobile-menu-button");
	const mobileMenu = document.querySelector(".navigation-menu");
	if (!mobileMenuButton || !mobileMenu) return;

	mobileMenuButton.addEventListener("click", () => {
			if (mobileMenu)
				mobileMenu.classList.toggle("hidden");
	})
};

const attachLoggedInMenuListener = () => {
	const mobileMenuButtonLoggedIn = document.querySelector(".mobile-menu-button-logged-in");
	const mobileMenuLoggedIn = document.querySelector(".navigation-menu-logged-in");
	if (!mobileMenuButtonLoggedIn || !mobileMenuLoggedIn) return;

	mobileMenuButtonLoggedIn.addEventListener("click", () => {
			if (mobileMenuLoggedIn)
				mobileMenuLoggedIn.classList.toggle("hidden");
	})
};

const attachLogoutListener = async () => {
	const logoutButtons = document.querySelectorAll(".logout-btn");
	logoutButtons.forEach(button => {
		button.addEventListener("click", async () => {
			try {
				await axios.post('https://trans.ella-peeters.me/api/logout');
				navigateTo('');
			} catch (error)	{
				console.error("The error is: ", error);
			}
		})
	});
}

const attachSideBarActiveLinkListener = () => {
	const links = document.querySelectorAll('.sidebar-link');
	const currentPath = window.location.pathname;

	links.forEach(link => {
		const href = link.getAttribute('href');
		if (href === currentPath) {
			link.classList.add('bg-primary', 'rounded');
		} else {
			link.classList.remove('bg-primary', 'rounded');
		}
	});
};
