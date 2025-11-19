import { renderNavBar } from '../components/NavBar.js'
import { renderHeroSection } from '../components/HeroSection.js'
import { renderFeaturesSection } from '../components/Features.js'
import { renderFooter } from '../components/Footer.js'

declare const axios: any;

export async function renderHomePage(): Promise<string> {

	let isLoggedIn = false;

	try {
		const res = await axios.get('https://trans.ella-peeters.me/api/users/verifytoken', {
			withCredentials: true
		});

		if (res.data.message === "OK") {
			isLoggedIn = true;
		}
	} catch (err) {
		console.warn("User is not logged in or token is invalid:", err);
	}


  return `
	  ${renderNavBar(isLoggedIn)}
	  ${renderHeroSection(isLoggedIn)}
	  ${renderFeaturesSection()}
	  ${renderFooter()}
  `;
}
