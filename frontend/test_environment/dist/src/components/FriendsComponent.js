import { updateHeaderInNavbar } from '../tools/helper.js';
function attachInputListener(userId, userArray, getSearchText, setSearchText, friendRequestsArray, friendsList) {
    const inputField = document.querySelector("#searchInput");
    if (!inputField)
        return;
    inputField.addEventListener("keydown", async (event) => {
        const target = event.target;
        if (event.key === "Enter") {
            const searchText = target.value;
            setSearchText(searchText);
            let results = [];
            if (searchText.length >= 3) {
                try {
                    const response = await axios.get(`https://trans.ella-peeters.me/api/users/search`, {
                        params: { q: searchText },
                    });
                    results = response.data;
                }
                catch (error) {
                    console.error("Search failed:", error);
                }
            }
            console.log("The results are: ", results);
            const container = document.getElementById("dashboard-content");
            if (container) {
                container.innerHTML = renderFriends(results, searchText, userId, friendsList, friendRequestsArray);
                attachInputListener(userId, results, getSearchText, setSearchText, friendsList, friendRequestsArray);
                attachFriendsRequestListener(userId);
            }
        }
    });
}
const attachFriendsRequestListener = async (userId) => {
    console.log("The friendsRequestListener runs");
    try {
        const friendRequestButtons = document.querySelectorAll("#sendFriendRequestButton");
        const acceptFriendRequestButtons = document.querySelectorAll("#acceptFriendRequestButton");
        const declineFriendRequestButtons = document.querySelectorAll("#declineFriendRequestButton");
        friendRequestButtons.forEach(button => {
            button.addEventListener("click", async () => {
                try {
                    const friendId = button.getAttribute("friendId");
                    const friendAddResponse = await axios.put(`https://trans.ella-peeters.me/api/users/${userId}/friends/requests`, {
                        friendId
                    });
                    console.log("The response after adding a new friend: ", friendAddResponse);
                }
                catch (error) {
                    console.log(error);
                }
            });
        });
        acceptFriendRequestButtons.forEach(button => {
            button.addEventListener("click", async () => {
                try {
                    console.log("UserId: ", userId);
                    const friendId = button.getAttribute("friendRequestId");
                    console.log("friendId: ", friendId);
                    const friendAddResponse = await axios.put(`https://trans.ella-peeters.me/api/users/${userId}/friends`, {
                        friendId
                    });
                    console.log("The response after accepting a new friend: ", friendAddResponse);
                }
                catch (error) {
                    console.log(error);
                }
            });
        });
    }
    catch (error) {
        console.log(error);
    }
};
//const attachGetFriendsRequestListener = async (userId: number) => {
//	console.log("The getFriendsRequestListener runs");
//
//	try {
//		const friendRequests = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends/requests`);
//		let friendRequestsArray = friendRequests.data;
//		console.log("The response after adding a new friend: ", friendRequestsArray);
//
//	} catch (error) {
//			console.log(error);	
//	}
//}
export const attachFriendsListener = async () => {
    console.log("The attachFriendsListener runs");
    updateHeaderInNavbar("Friends");
    try {
        const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
        const userId = idResponse.data.id;
        console.log("The user id is: ", userId);
        const friendsListResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends`);
        const friendsList = friendsListResponse.data;
        console.log("The friendslist is: ", friendsList);
        const friendRequests = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends/requests`);
        let friendRequestsArray = friendRequests.data;
        console.log("The request list is: ", friendRequestsArray);
        let searchText = '';
        let userArray = [];
        const getSearchText = () => searchText;
        const setSearchText = (val) => { searchText = val; };
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = renderFriends(userArray, searchText, userId, friendsList, friendRequestsArray);
            attachInputListener(userId, userArray, getSearchText, setSearchText, friendsList, friendRequestsArray);
            attachFriendsRequestListener(userId);
            //attachGetFriendsRequestListener(userId, friendRequestsArray);
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
export const renderFriends = (userArray, searchText = '', userId, friendRequestsArray, friendsList) => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Friends</h1>
							<p class="text-slate-400">Connect and play with your buddies</p>
						</div>
						<div class="mt-6 py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
							<h1 class="text-xl mb-4">Pending friend requests</h1>
							<div>
								${friendRequestsArray.length > 0 ? `
									<div class="grid grid-cols-1 gap-4 mt-6 items-center">
										${friendRequestsArray.map(user => `
							 				<div class="flex bg-slate-600 border border-slate-400 rounded-md py-4 px-8 flex justify-between items-center">
												<div class="flex flex-row items-center">
													<img src=${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(2) + '&background=000000&color=ffffff&bold=true'} class="h-10"></img>
							  						<p class="font-semibold text-white text-m ml-3 truncate max-w-[180px]">${user}</p>
												</div>
												<div class="flex flex-row gap-6 items-center">
													<button id="acceptFriendRequestButton" class="bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all rounded-md py-1 px-3" friendRequestId=${user}>Accept</button> 
													<button id=""declineFriendRerquestButton" class="text-slate-400 hover:text-white px-3 py-1 border border-slate-400 rounded-md">Decline</button> 
												</div>
							 				</div>
										`).join('')}
										</div>
									` : `
									<div class="py-2">
										<p class="text-m text-gray-400 font-extralight">No pending friend requests</p>
									</div>
								`}
							</div>



						</div>
						<div class="grid grid-cols-1 md:grid-cols-3 mt-4 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
								<h2 class="text-sm font-medium text-slate-300">Total friends</h2>
								<p class="text-2xl font-bold text-white">${friendsList.length}</p>
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
								value="${searchText}"
  								placeholder="Search for a player by typing at least 3 characters of a nickname and press enter..."
  								class="w-full px-4 py-2 bg-slate-600 text-white placeholder-slate-400 placeholder:text-sm rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
							/>

							<div>
  								${userArray.length > 0 ? `
    									<div class="grid grid-cols-1 gap-4 mt-6 items-center">
      										${userArray.map(user => `
        										<div class="flex bg-slate-600 border border-slate-400 rounded-md py-4 px-8 flex justify-between items-center">
												<div class="flex flex-row items-center">
													<img src=${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nickname) + '&background=000000&color=ffffff&bold=true'} class="h-10"></img>
         												<p class="font-semibold text-white text-m ml-3 truncate max-w-[180px]">${user.nickname}</p>
												</div>
												<div class="flex flex-row gap-6 items-center">
													${userId !== user.id ? `
													<button id="sendFriendRequestButton" class="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all rounded-md py-1 px-3" friendId=${user.id}>Add friend</button>` : `<p class="text-slate-400 px-2 py-1 text-xs">You cannot add yourself</p>`} 
													${userId !== user.id ? `
													<a href="#" class="text-slate-400 hover:text-white hover:bg-slate-700 px-2 py-1 text-xs">View profile</a>` : ``} 
												</div>
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
						<div class="mb-4 px-8 py-4 bg-slate-800 rounded-md border border-slate-700">
							<h1 class="text-xl mb-4">Friends list</h1>

						</div>
					</div>	
				</div>
	  `;
};
