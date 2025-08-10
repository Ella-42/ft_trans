import { updateHeaderInNavbar } from '../tools/helper.js';
import { navigateTo } from '../../router.js';
const getFriendDetails = async (friendIds) => {
    const friendDetails = await Promise.all(friendIds.map(async (id) => {
        try {
            const res = await axios.get(`https://trans.ella-peeters.me/api/users/${id}`);
            return {
                id,
                nickname: res.data.nickname,
                avatar: res.data.avatar
            };
        }
        catch (err) {
            console.error(`Failed to fetch details for friend ID ${id}:`, err);
            return null;
        }
    }));
    return friendDetails.filter(Boolean);
};
const attachUserProfileButtonsListener = async (userId) => {
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
                }
                catch (error) {
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
            });
        });
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
                }
                catch (error) {
                    console.log(error);
                }
            });
        });
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
                }
                catch (error) {
                    console.log(error);
                }
            });
        });
        removeFriendButtons.forEach(button => {
            button.addEventListener("click", async () => {
                try {
                    const friendId = button.getAttribute("friendToDeleteId");
                    if (confirm("Are you sure you want to delete this friend?")) {
                        await axios.delete(`https://trans.ella-peeters.me/api/users/${userId}/friends`, {
                            data: { friendId }
                        });
                        navigateTo("/safe/dashboard/friends");
                    }
                    else {
                        return;
                    }
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
export const attachUserProfileListener = async () => {
    updateHeaderInNavbar("User profile");
    try {
        const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
        const userId = String(idResponse.data.id);
        const friendsListResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends`);
        const friendsList = friendsListResponse.data;
        const friendRequests = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/friends/requests`);
        let friendRequestsArray = friendRequests.data;
        const enrichedFriendsList = await getFriendDetails(friendsList);
        let searchText = '';
        let userArray = [];
        const getSearchText = () => searchText;
        const setSearchText = (val) => { searchText = val; };
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = renderUserProfile(userId);
            attachUserProfileButtonsListener(userId);
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
export const renderUserProfile = (userId) => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Pieter Claus</h1>
							<p class="text-slate-400">Connect and play with your buddies</p>
						</div>
						<div class="mt-6 py-4 px-8 bg-slate-800 rounded-md border border-slate-700">
							<h1 class="text-xl mb-4">Pending friend requests</h1>



						</div>
					</div>	
				</div>
	  `;
};
