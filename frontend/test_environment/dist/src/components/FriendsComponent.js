import { updateHeaderInNavbar } from '../tools/helper.js';
export const attachFriendsListener = async () => {
    console.log("The attachFriendsListener runs");
    updateHeaderInNavbar("Friends");
    try {
        const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
        const userId = idResponse.data.id;
        const friendsResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends`);
        console.log("The friends response is: ", friendsResponse);
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = renderFriends();
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
export const renderFriends = () => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Friends</h1>
							<p className="text-slate-400">Connect and play with your buddies</p>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-3 mt-6 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total friends</h2>
								<p class="ext-2xl font-bold text-white">10</p>
								<p class="text-xs text-slate-400">In your network</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Online now</h2>
								<p class="ext-2xl font-bold text-green">3</p>
								<p class="text-xs text-slate-400">Ready to play</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Add friends</h2>
							</div>

						</div>
					</div	
				</div>
	  `;
};
