import { updateHeaderInNavbar } from '../tools/helper.js';
export const attachFriendsListener = async () => {
    console.log("The attachFriendsListener runs");
    updateHeaderInNavbar("Friends");
    try {
        const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
        const userId = idResponse.data.id;
        const friendsResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends`);
        console.log("The friends response is: ", friendsResponse);
        let userArray;
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = renderFriends(userArray);
        }
        let debounceTimeout = null;
        const inputField = document.querySelector("#searchInput");
        if (inputField) {
            inputField.addEventListener("input", (event) => {
                const target = event.target;
                const value = target.value;
                console.log("User is typing:", value);
                if (debounceTimeout) {
                    clearTimeout(debounceTimeout);
                }
                debounceTimeout = setTimeout(async () => {
                    try {
                        const response = await axios.get("https://trans.ella-peeters.me/api/users", {
                            params: { search: value },
                        });
                        console.log("Search results:", response.data);
                        userArray = response.data;
                    }
                    catch (error) {
                        console.error("Error fetching users:", error);
                    }
                }, 1000);
            });
        }
    }
    catch (error) {
        console.error("The error is: ", error);
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = `<p class="text-red-500">Error loading stats.</p>`;
        }
    }
};
export const renderFriends = (userArray) => {
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
						<div class="my-4 py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
							<h1 class="text-xl mb-4">Look for players</h1>
							<input
								id="searchInput"
  								type="text"
  								placeholder="Search for a player by typing a nickname..."
  								class="w-full px-4 py-2 bg-slate-600 text-white placeholder-slate-400 placeholder:text-sm rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>
							<div class="flex flex-col items-center py-12">
								<p class="text-xl text-gray-400 mb-2 font-extralight">Search for players</p>
								<p class="text-m text-gray-400 font-extralight">Enter a nickname to find other Pong players</p>
							</div>

							<div>
								<p>Here comes the array of found users</p>
							</div>


						</div>
					</div>	
				</div>
	  `;
};
