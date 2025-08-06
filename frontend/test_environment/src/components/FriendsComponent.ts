import { User } from '../interfaces/user';
import { updateHeaderInNavbar } from '../tools/helper.js';
declare const axios: any;

export const attachFriendsListener= async () => {
	console.log("The attachFriendsListener runs");

	updateHeaderInNavbar("Friends");

	try {
		const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
    		const userId = idResponse.data.id;
    		const friendsResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends`);

		console.log("The friends response is: ", friendsResponse);

		let userArray: Array<{ avatar: string, id: number, nickname: string }> = [];

    		const container = document.getElementById("dashboard-content");
    		if (container) {
    			container.innerHTML = renderFriends(userArray);
    		}

		let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
		const inputField = document.querySelector("#searchInput");
		if (inputField) {
  			inputField.addEventListener("input", (event) => {
    			const target = event.target as HTMLInputElement;
    			const value = target.value;
    			console.log("User is typing:", value);

   			if (debounceTimeout) {
      			clearTimeout(debounceTimeout);
    		}

   		debounceTimeout = setTimeout(async () => {
			if (value.length >= 3)
			{

      				try {
        				const response = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/search`, {
          				params: { q: value }, 
        			});
        			console.log("Search results:", response.data);
				userArray = response.data;
				const container = document.getElementById("dashboard-content");
      				if (container) {
        				container.innerHTML = renderFriends(userArray);
      				}
      				} catch (error) {
        				console.error("Error fetching users:", error);
      				}}
    				}, 1000);
			
		});
}

  	} catch (error) {
    		console.error("The error is: ", error);
    		const container = document.getElementById("dashboard-content");
    		if (container) {
      			container.innerHTML = `<p class="text-red-500">Error loading stats.</p>`;
    		}
  	}
};

export const renderFriends = (userArray: Array<{avatar: string, id: number, nickname: string}>) => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Friends</h1>
							<p class="text-slate-400">Connect and play with your buddies</p>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-3 mt-6 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
								<h2 class="text-sm font-medium text-slate-300">Total friends</h2>
								<p class="text-2xl font-bold text-white">10</p>
								<p class="text-xs text-slate-400">In your network</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
								<h2 class="text-sm font-medium text-slate-300">Online now</h2>
								<p class="text-2xl font-bold text-green-600">3</p>
								<p class="text-xs text-slate-400">Ready to play</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
								<h2 class="text-sm font-medium text-slate-300">Add friends</h2>
							</div>

						</div>
						<div class="my-4 py-4 px-8 bg-slate-800 rounded-md border border-slate-700 min-h-64">
							<h1 class="text-xl mb-4">Look for players</h1>
							<input
								id="searchInput"
  								type="text"
  								placeholder="Search for a player by typing at least 3 characters of a nickname..."
  								class="w-full px-4 py-2 bg-slate-600 text-white placeholder-slate-400 placeholder:text-sm rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>

							<div>
  								${userArray.length > 0 ? `
    									<div class="grid grid-cols-1 gap-4 mt-4 items-center">
      										${userArray.map(user => `
        										<div class="flex bg-slate-600 border border-slate-400 rounded-md py-4 px-8 flex justify-between items-center">
												<div class="flex flex-row items-center">
													<img src=${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nickname) + '&background=000000&color=ffffff&bold=true'} class="h-10"></img>
         												<p class="font-semibold text-white text-m ml-3 truncate max-w-[180px]">${user.nickname}</p>
												</div>
												<button>Profile</button>
        										</div>
      										`).join('')}
    									</div>
  									` : `
									<div class="flex flex-col items-center py-12">
										<p class="text-xl text-gray-400 mb-2 font-extralight">Search for players</p>
										<p class="text-m text-gray-400 font-extralight">Enter at least 3 characters of a nickname to find other Pong players</p>
									</div>
  								`}
							</div>



						</div>
					</div>	
				</div>
	  `;
}
