import { togglePassword } from '../tools/helper.js';
//async function showAvatar() {
//            const id = document.getElementById('avatar').value;
//            const res = await fetch(`/api/users/${id}/avatar`);
//            const users = await res.json();
//            const avatarImg = users.avatar_img || 'https://42.fr/wp-content/uploads/2021/05/42-Final-sigle-seul.svg'; //temp image, need to be replaced
//            const list = document.getElementById('avatar_block');
//            list.innerHTML = 
//                `<img src = "${avatarImg}", width="320">`;
//}
export const attachUpdateProfileFormListener = async () => {
    const updateProfileForm = document.querySelector('#updateProfileForm');
    const showOldPasswordIcon = document.querySelector('.lucide-eye-icon');
    const showNewPasswordIcon = document.querySelector('.lucide-eye-icon-new');
    if (showOldPasswordIcon || showNewPasswordIcon) {
        showOldPasswordIcon.addEventListener('click', () => {
            togglePassword();
        });
        showNewPasswordIcon.addEventListener('click', () => {
            togglePassword();
        });
    }
    console.log("The update profile event listener runs");
    const response = await axios.get('https://trans.ella-peeters.me/api/whoami');
    console.log("The response is: ", response);
    const nameInput = document.querySelector('#name');
    if (nameInput)
        nameInput.value = response.data.nickname || '';
    const avatarResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${response.data.id}/avatar`);
    console.log("The avatar response is: ", avatarResponse);
    const avatarLink = avatarResponse.data.avatar_img;
    const avatarBlock = document.getElementById('avatarBlock');
    avatarBlock.innerHTML = `<img src ="${avatarLink}" width="320">`;
};
export const renderProfile = () => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between ">
						<p class="text-l" id="">Edit your profile and account settings.</p>

						<div class="grid grid-cols-2 items-center">
							<form>
								<div class="flex items-center flex-col">
									<div id="avatarBlock">
									</div>
                    							<button class="h-10 mt-10 rounded-md bg-primary text-white font-medium hover:bg-white hover:text-primary transition" type="button" onclick="updateUser()">Update avatar</button>

								</div>
							</form>
							<form id="updateProfileForm">
        							<div class="grid grid-cols-1 gap-4 mt-9">
									<div class="flex flex-col">
                    								<label for="name" class="text-base mb-2">Nickame</label>
                    								<input class="h-10 rounded px-3 text-black" type="text" id="name" name="name">
								</div>
								<div class="flex flex-col">
                    							<label for="email" class="text-base">Email</label>
                    							<input class="h-10 rounded px-3 text-black" type="email" id="email" name="email" placeholder="Your email">
								</div>
								<div class="flex flex-col">
                    							<label for="oldPassword" class="text-base">Old password</label>
									<div class="flex items-center gap-2">
                    								<input class="h-10 rounded px-3 text-black w-11/12" type="password" id="password" name="oldPassword" placeholder="Old password">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
									</div>
								</div>
								<div class="flex flex-col">
                    							<label for="newPassword" class="text-base">New password</label>
									<div class="flex items-center gap-2">
                    								<input class="h-10 rounded px-3 text-black w-11/12" type="password" id="passwordConfirmation" name="passwordConfirmation" placeholder="New password">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon-new lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
									</div>
								</div>
                    
                    						<button class="h-10 mt-5 rounded-md bg-primary text-white font-medium hover:bg-white hover:text-primary transition" type="button" onclick="updateUser()">Update profile</button>
                					</div>
						</form>
						</div>
						</div>
				</div>
	  `;
};
