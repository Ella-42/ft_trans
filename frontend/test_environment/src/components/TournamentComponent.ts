import { User } from '../interfaces/user';
declare const axios: any;

export const renderTournament = () => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex justify-between items-center">
						<p class="font-extralight text-xl" id="username-greeting">This is the tournament page in the dashboard 👋</p>
					</div>
				</div>
	  `;
}
