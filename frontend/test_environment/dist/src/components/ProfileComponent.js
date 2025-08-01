import { togglePassword, provideUserFeedback } from '../tools/helper.js';
import { updateHeaderInNavbar } from '../tools/helper.js';
export const attachUpdateProfileFormListener = async () => {
    setTimeout(() => updateHeaderInNavbar("Profile"), 50);
    const twoFactorToggle = document.querySelector('#twoFactorToggle');
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
    const response = await axios.get('https://trans.ella-peeters.me/api/whoami');
    const avatarResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${response.data.id}/avatar`);
    const avatarLink = avatarResponse.data.avatar;
    const avatarBlock = document.getElementById('avatarBlock');
    avatarBlock.innerHTML = `<img src ="${avatarLink}" width="320">`;
    twoFactorToggle.checked = (await axios.get(`https://trans.ella-peeters.me/api/users/${response.data.id}/2fa`)).data.two_factor;
    twoFactorToggle.addEventListener('change', async () => {
        console.log('2FA state toggled');
        const res = await fetch(`https://trans.ella-peeters.me/api/users/${response.data.id}/2fa`, {
            method: 'POST',
            credentials: 'include',
        });
        const json = await res.json();
        if (json.error) {
            twoFactorToggle.checked = !twoFactorToggle.checked;
            Swal.fire({
                title: 'Oops!',
                text: json.error,
                icon: 'error'
            });
        }
    });
    const deleteProfileButton = document.querySelector("#deleteProfileButton");
    deleteProfileButton.addEventListener('click', async (e) => {
        if (deleteProfileButton) {
            const confirmed = confirm("Are you sure you want to delete your profile? This action cannot be undone.");
            const token = localStorage.getItem('token');
            if (!token)
                return;
            if (confirmed) {
                try {
                    const deleteResponse = await axios.delete(`https://trans.ella-peeters.me/api/users/${response.data.id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    sessionStorage.clear();
                    window.location.href = '/safe';
                }
                catch (error) {
                    Swal.fire({
                        title: "Error",
                        text: "There was an error deleting your account. Try again later!",
                        icon: "error"
                    });
                }
            }
        }
    });
    const updateProfileButton = document.querySelector('#updateProfileButton');
    updateProfileButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const updateProfileForm = document.querySelector('#updateProfileForm');
        const formData = new FormData(updateProfileForm);
        const nameInput = document.querySelector('#name');
        const emailInput = document.querySelector('#email');
        const avatarInput = document.querySelector('#avatar_img');
        const newPasswordInput = document.querySelector('#passwordConfirmation');
        const oldPasswordInput = document.querySelector('#password');
        const body = {};
        if (nameInput?.value)
            body.name = nameInput.value;
        if (emailInput?.value)
            body.email = emailInput.value;
        if (avatarInput?.value)
            body.avatar = avatarInput.value;
        if (newPasswordInput?.value)
            body.password = newPasswordInput.value;
        if (oldPasswordInput?.value)
            body.oldPassword = oldPasswordInput.value;
        const res = await fetch(`https://trans.ella-peeters.me/api/users/${response.data.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const jsonResponse = await res.json();
        provideUserFeedback(jsonResponse);
    });
};
export const renderProfile = () => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between ">
						<p class="text-xl mb-8" id="">Edit your profile and account settings.</p>

						<p class="text-xl mt-10 mb-4">Settings</p>
						<p class="mt-10 mb-2">Two-Factor Authentication</p>
						<div class="flex items-center gap-4 mb-8">
							<label for="twoFactorToggle" class="text-base">Enable 2FA</label>
								<label class="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" id="twoFactorToggle" class="sr-only peer">
								<div class="w-11 h-6 bg-gray-400 rounded-full peer-checked:bg-purple-600 transition"></div>
								<div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
							</label>
						</div>

						<p class="text-xl mt-10 mb-4">Update profile</p>
						<div class="grid grid-cols-1 items-center">
							<form id="updateProfileForm" class="grid grid-cols-1 md:grid-cols-2 md:gap-3 item-center">
								<div class="flex items-center flex-col mt-8 pb-8 order-2 md:mt-4 md:pb-4">
									<div id="avatarBlock">
									</div>
									<input class="h-10 rounded px-3 text-black mt-4" type="text" id="avatar_img" placeholder="Link to your new avatar">

								</div>
        							<div class="grid grid-cols-1 gap-4 mt-9 order-1">
									<div class="flex flex-col">
                    								<label for="name" class="text-base mb-2">Nickame</label>
                    								<input class="h-10 rounded px-3 text-black" type="text" id="name" name="name" placeholder="Your new nickname">
								</div>
								<div class="flex flex-col">
                    							<label for="email" class="text-base">Email</label>
                    							<input class="h-10 rounded px-3 text-black" type="email" id="email" name="email" placeholder="Your new email">
								</div>
								<div class="flex flex-col">
									<label for="newPassword" class="text-base">New password</label>
									<div class="flex items-center gap-2">
									<input class="h-10 rounded px-3 text-black w-11/12" type="password" id="passwordConfirmation" name="passwordConfirmation" placeholder="New password">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon-new lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
									</div>
								</div>
								<div class="flex flex-col">
									<label for="oldPassword" class="text-base">Old password</label>
									<div class="flex items-center gap-2">
									<input class="h-10 rounded px-3 text-black w-11/12" type="password" id="password" name="oldPassword" placeholder="Old password (required)">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
									</div>
								</div>
                    
                    						<button class="h-10 mt-5 rounded-md bg-primary text-white font-medium hover:bg-white hover:text-primary transition" type="submit" id="updateProfileButton">Update profile</button>
                					</div>
						</form>
						<div>
							<p class="text-xl mt-10 mb-4">Delete profile</p>
                    						<button class="h-10 px-8 py-4mt-5 rounded-md bg-red-500 border-red-500 text-white font-medium hover:bg-white hover:text-red-500 transition " type="submit" id="deleteProfileButton">Delete profile</button>
						</div>
						</div>
						</div>
				</div>
	  `;
};
