import { User } from '../interfaces/user';
import { updateHeaderInNavbar } from '../tools/helper.js';
import { navigateTo } from '../../router.js';
declare const axios: any;

let online;
const getFriendDetails = async (friendIds: string[]) => {
	online = 0;
	const friendDetails = await Promise.all(
		friendIds.map(async (id) => {
			try {
        			const res = await axios.get(`https://trans.ella-peeters.me/api/users/${id}`);
					const response = await fetch(`/api/users/${id}/ping`, { method: 'GET' });
					const data = await response.json();
					if (data.message === 'Online') online++;
       				return {
       	   				id,
        	  			nickname: res.data.nickname,
						avatar: res.data.avatar,
						ping: data.message
        			};
      			} catch (err) {
        			console.error(`Failed to fetch details for friend ID ${id}:`, err);
        			return null;
      			}
    		})
  	);
	return friendDetails.filter(Boolean);
}

function attachInputListener(userId: number, userArray: Array<any>, getSearchText: () => string, setSearchText: (val: string) => void, enrichedFriendRequestsArray: Array<any>, enrichedFriendsList: Array<any>) {
	const inputField = document.querySelector("#searchInput");

	if (!inputField) return;

	inputField.addEventListener("keydown", async (event: KeyboardEvent) => {
		const target = event.target as HTMLInputElement;

		if (event.key === "Enter") {
			const searchText = target.value.trim();
			setSearchText(searchText);
			let results: Array<any> = [];
			if (searchText.length >= 3) {
				try {
					const response = await axios.get(`https://trans.ella-peeters.me/api/users/search`, {
						params: { q: searchText },
					});
					results = response.data;

					if (results.length === 0) {
						const searchInformation = document.getElementById("searchInformation");
     						if (searchInformation) {
        						searchInformation.innerHTML = `
          							<div class="flex flex-col items-center py-12">
            								<p class="text-xl text-gray-400 mb-2 font-extralight">No users found</p>
            								<p class="text-m text-gray-400 font-extralight">Try another search term or check your spelling.</p>
          							</div>
        						`;
      						}
     						return;
					}
				} catch (error) {
					console.error("Search failed:", error);
				}
			}
			const container = document.getElementById("dashboard-content");
			if (container) {
				container.innerHTML = renderFriends(results, searchText, userId, enrichedFriendsList, enrichedFriendRequestsArray, online);
				attachInputListener(userId, results, getSearchText, setSearchText, enrichedFriendRequestsArray, enrichedFriendsList);
				attachFriendButtonsListener(userId);
			}
		}
	});
}

const attachFriendButtonsListener = async (userId: number) => {
	try {
		let friendId = "";
		const friendRequestButtons = document.querySelectorAll("#sendFriendRequestButton");
		const acceptFriendRequestButtons = document.querySelectorAll("#acceptFriendRequestButton");
		const declineFriendRequestButtons = document.querySelectorAll("#declineFriendRequestButton");
		const removeFriendButtons = document.querySelectorAll("#deleteFriendButton");
		friendRequestButtons.forEach(button => {
			button.addEventListener("click", async () => {
				try {
					friendId = button.getAttribute("friendId");
					const friendAddResponse = await axios.put(`https://trans.ella-peeters.me/api/users/${userId}/friends/requests`, {
						friendId
					});
					if (friendAddResponse.data.message === "Friend request already pending") {
						button.outerHTML = `
          						<p class="text-slate-400 px-2 py-1 text-xs">
            							Friend request already pending	
          						</p>
        					`;
					}
					if (friendAddResponse.data.message === "Friend request sent successfully") {
						button.outerHTML = `
          						<p class="text-slate-400 px-2 py-1 text-xs">
            							Friend request sent 
          						</p>
        					`;
						
					}

				} catch (error) {
					if (error.response.data.error === "Friend already pending for you, please add them instead") {
						if (confirm("You already have a pending friend request from this user. Do you want to accept this request?")) {
							await axios.put(`https://trans.ella-peeters.me/api/users/${userId}/friends`, {
								friendId 
							});
							navigateTo("/safe/dashboard/friends");
						}
					}
					else {
						console.log(error);	
					}
				}
			})
		})
		declineFriendRequestButtons.forEach(button => {
			button.addEventListener("click", async () => {
				try {
					const friendId = button.getAttribute("friendRequestId");
					if (confirm("Are you sure you want to decline this friend request?")) {
						await axios.delete(`https://trans.ella-peeters.me/api/users/${userId}/friends/requests`, {
							data: { friendId }
						});
						navigateTo("/safe/dashboard/friends");
					}
				} catch (error) {
					console.log(error);	
				}
			})
		})
		acceptFriendRequestButtons.forEach(button => {
			button.addEventListener("click", async () => {
				try {
					const friendId = button.getAttribute("friendRequestId");
					if (confirm("Are you sure you want to accept this friend request?")) {
						await axios.put(`https://trans.ella-peeters.me/api/users/${userId}/friends`, {
							friendId
						});
						navigateTo("/safe/dashboard/friends");
					}
				} catch (error) {
					console.log(error);	
				}
			})
		})
		removeFriendButtons.forEach(button => {
			button.addEventListener("click", async () => {
				try {
					const friendId = button.getAttribute("friendToDeleteId");
					if (confirm("Are you sure you want to delete this friend?")) {
						await axios.delete(`https://trans.ella-peeters.me/api/users/${userId}/friends`, {
							data : { friendId }
						});
						navigateTo("/safe/dashboard/friends");
					} else {
						return
					}
				} catch (error) {
					console.log(error);	
				}
			})
		})

	} catch (error) {
		console.log(error);	
	}
}

export const attachFriendsListener = async () => {
	updateHeaderInNavbar("Friends");
	try {
		const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
		const userId = idResponse.data.id;
		const friendsListResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends`);
		const friendsList = friendsListResponse.data;
		const friendRequests = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends/requests`);
		const friendRequestsArray = friendRequests.data;
		const enrichedFriendRequestsArray = await getFriendDetails(friendRequestsArray);
		const enrichedFriendsList = await getFriendDetails(friendsList);

		let online = 0;
		enrichedFriendsList.forEach(user => { if (user.ping === 'Online') online++; });

		let searchText = '';
		let userArray: Array<{ avatar: string, id: number, nickname: string }> = [];

		const getSearchText = () => searchText;
		const setSearchText = (val: string) => { searchText = val; };

		const container = document.getElementById("dashboard-content");
		if (container) {
			container.innerHTML = renderFriends(userArray, searchText, userId, enrichedFriendsList, enrichedFriendRequestsArray, online);
			attachInputListener(userId, userArray, getSearchText, setSearchText, enrichedFriendRequestsArray, enrichedFriendsList);
			attachFriendButtonsListener(userId);
		}
	} catch (error) {
		console.error("The error is: ", error);
		const container = document.getElementById("dashboard-content");
		if (container) {
			container.innerHTML = `<p class="text-red-500">Error loading stats.</p>`;
		}
	}
};

export const renderFriends = (userArray: Array<{avatar: string, id: number, nickname: string}>, searchText: string = '', userId: number, enrichedFriendsList: Array<any>, enrichedFriendRequestsArray: Array<any>, online: number) => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Friends</h1>
							<p class="text-slate-400">Connect and play with your buddies</p>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 mt-4 mb-2 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
								<h2 class="text-sm font-medium text-slate-300">Total friends</h2>
								<p class="text-2xl font-bold text-white">${enrichedFriendsList.length}</p>
								<p class="text-xs text-slate-400">In your network</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
								<h2 class="text-sm font-medium text-slate-300">Online now</h2>
								<p class="text-2xl font-bold ${online === 0 ? 'text-gray-500' : 'text-green-600'}">${online}</p>
								<p class="text-xs text-slate-400">Ready to play</p>
							</div>
						</div>
						<div class="my-2 py-4 px-8 bg-slate-800 rounded-md border border-slate-700 min-h-64">
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
    									<div id="searchInformation" class="grid grid-cols-1 gap-4 mt-6 items-center">
      										${userArray.map(user =>  
											`
        										<div class="flex bg-slate-600 border border-slate-400 rounded-md py-4 px-8 justify-between items-center">
												<div class="flex flex-row items-center">
													<div class="w-10 h-10 overflow-hidden">
														<img src=${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nickname) + '&background=000000&color=ffffff&bold=true'} class="h-full w-full object-cover"/>
													</div>
         												<p class="font-semibold text-white text-m ml-3 truncate max-w-[180px]">${user.nickname}</p>
												</div>
												<div class="flex flex-row gap-6 items-center">
													${userId !== user.id ? (enrichedFriendsList.some(friend => String(friend.id) === String(user.id)) ? `<p class="text-slate-400 px-2 py-1 text-xs">Already friends</p>` : `<button id="sendFriendRequestButton" class="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all rounded-md py-1 px-3" friendId=${user.id}>Add friend</button>`) : `<p class="text-slate-400 px-2 py-1 text-xs">You cannot add yourself</p>`} 
												</div>
        										</div>
      										`).join('')}
    									</div>
  									` : `
									<div id="searchInformation" class="flex flex-col items-center py-12">
										<p class="text-xl text-gray-400 mb-2 font-extralight">Search for players</p>
										<p class="text-m text-gray-400 font-extralight">Enter at least 3 characters of a nickname to find other Pong players</p>
									</div>
  								`}
								
							</div>



						</div>
						<div class="my-2 py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
							<h1 class="text-xl mb-4">Pending friend requests</h1>
							<div>
								${enrichedFriendRequestsArray.length > 0 ? `
									<div class="grid grid-cols-1 gap-4 mt-6 items-center">
										${enrichedFriendRequestsArray.map(user => `
											<div class="flex bg-slate-600 border border-slate-400 rounded-md py-4 px-8 flex justify-between items-center">
												<div class="flex flex-row items-center">
													<div class="w-10 h-10 overflow-hidden">
														<img src=${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(2) + '&background=000000&color=ffffff&bold=true'} class="w-full h-full object-cover"/>
													</div>
													<p class="font-semibold text-white text-m ml-3 truncate max-w-[180px]">${user.nickname}</p>
												</div>
												<div class="flex flex-row gap-6 items-center">
													<button id="acceptFriendRequestButton" class="bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all rounded-md py-1 px-3" friendRequestId=${user.id}>Accept</button>
													<button id="declineFriendRequestButton" class="text-slate-400 hover:text-white px-3 py-1 border border-slate-400 rounded-md" friendRequestId=${user.id}>Decline</button>
												</div>
											</div>
										`).join('')}
										</div>
									` : `
									<div class="py-1">
										<p class="text-m text-gray-400 font-extralight">No pending friend requests</p>
									</div>
								`}
							</div>
						</div>
						<div class="mt-2 px-8 py-4 bg-slate-800 rounded-md border border-slate-700">
							<h1 class="text-xl mb-4">Friends list</h1>
							<div>
								${enrichedFriendsList.length > 0 ? `
									<div class="grid grid-cols-1 gap-4 mt-6 items-center">
										${enrichedFriendsList.map(user => `
							 				<div class="flex flex-col md:flex-row bg-slate-600 border border-slate-400 rounded-md py-4 gap-4 px-8 justify-between items-center">
												<div class="flex flex-row items-center">
													<div class="w-10 h-10 overflow-hidden">
														<img src=${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(2) + '&background=000000&color=ffffff&bold=true'} class="h-full w-full object-cover"></img>
													</div>
							  						<p class="font-semibold text-white text-m ml-3 truncate max-w-[200px]">${user.nickname}</p>
												</div>
												<div class="flex flex-row gap-6 items-center">
													<div class="flex items-center gap-2">
														<span class="text-sm text-gray-200">${user.ping}</span>
														<span class="mt-1 h-2 w-2 rounded-full ${user.ping === 'Online' ? 'bg-green-600' : user.ping === 'Offline' ? 'bg-gray-500' : 'bg-orange-400'}"></span>
													</div>
													<button id="deleteFriendButton" class="text-white px-3 py-1 bg-red-400 rounded-md" friendToDeleteId=${user.id}>Delete friend</button> 
													<a data-link href="/safe/dashboard/profile/${user.id}" class="text-slate-400 hover:text-white hover:bg-slate-700 px-2 py-1 text-xs">View profile</a>
												</div>
							 				</div>
										`).join('')}
										</div>
									` : `
									<div class="py-1">
										<p class="text-m text-gray-400 font-extralight">You haven't made any friends (yet)</p>
									</div>
								`}
							</div>
						</div>
					</div>	
				</div>
	  `;
}
