import { renderLoggedInSideBar } from '../components/LoggedInSideBar.js'
import { renderFooter } from '../components/Footer.js'
import { renderLoggedInNavBar } from '../components/LoggedInNavBar.js';
//import { renderFriends } from '../components/Friends';
//import { renderRecentMatches } from '../components/RecentMatches';
import { User } from '../interfaces/user';
declare const axios: any;

const date = new Date().toLocaleDateString('en-us', {weekday: "long", month: "short", day: "numeric"});

export const attachDashboardListener = async () => {
	console.log("The attachDashboardistener runs");
	try {
		const response = await axios.get('https://trans.ella-peeters.me/api/whoami');
		console.log("The reponse after logging in is: ", response);
		const user = response.data;
	} catch (error) {
		console.error("The error is: ", error);
	}
};

export const renderDashboard = (user: User): string => {
	return `
	<section class="flex min-h-screen">
		${renderLoggedInSideBar()}
		<section class="flex flex-col w-full min-h-full">
			${renderLoggedInNavBar(user)}
			<section id="dashboard-content" class="bg-primary-background text-white w-full flex-1 justify-between">
				
			</section>
			${renderFooter()}
		</section>
	</section>
	  `;
}

