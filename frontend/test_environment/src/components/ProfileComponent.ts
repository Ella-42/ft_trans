import { togglePassword, provideUserFeedback } from '../tools/helper.js';
declare const axios: any;
declare const Swal: any;

export const attachUpdateProfileFormListener = async () => {
	const updateProfileForm = document.querySelector('#updateProfileForm');
	const showOldPasswordIcon = document.querySelector('.lucide-eye-icon');
	const showNewPasswordIcon= document.querySelector('.lucide-eye-icon-new');

	if (showOldPasswordIcon || showNewPasswordIcon)
	{
		showOldPasswordIcon.addEventListener('click', () => {
			togglePassword();
	});
		showNewPasswordIcon.addEventListener('click', () => {
			togglePassword();
		});
	}

	const response = await axios.get('https://trans.ella-peeters.me/api/whoami');
	const avatarResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${response.data.id}/avatar`);
	const avatarLink = avatarResponse.data.avatar_img;
	const avatarBlock = document.getElementById('avatarBlock');
	avatarBlock.innerHTML = `<img src ="${avatarLink}" width="320">`

	const deleteProfileButton = document.querySelector("#deleteProfileButton");
	deleteProfileButton.addEventListener('click', async (e) => {
		e.preventDefault();
		console.log("The button to delete the profile has been clicked!");
	});

	const updateProfileButton = document.querySelector('#updateProfileButton');
	updateProfileButton.addEventListener('click', async (e) => {
		e.preventDefault();
		const updateProfileForm = document.querySelector('#updateProfileForm') as HTMLFormElement;
		const formData = new FormData(updateProfileForm);
		const nameInput = document.querySelector<HTMLInputElement>('#name');
		const emailInput = document.querySelector<HTMLInputElement>('#email');
		const avatarInput = document.querySelector<HTMLInputElement>('#avatar_img');
    		const oldPasswordInput = document.querySelector<HTMLInputElement>('#password');
   		const newPasswordInput = document.querySelector<HTMLInputElement>('#passwordConfirmation');

		const body: Record<string, string> = {};
		if (nameInput?.value) body.name = nameInput.value;
		if (emailInput?.value) body.email = emailInput.value;
		if (avatarInput?.value) body.avatar = avatarInput.value;
		if (oldPasswordInput?.value) body.oldPassword = oldPasswordInput.value;
		if (newPasswordInput?.value) body.password = newPasswordInput.value;

		if (Object.keys(body).length === 0)
		{	
			Swal.fire(
			{
				title: 'Oops!',
				text: "All the fields are empty!",
				icon: 'error',
			})
			return;
		}

    		const res = await fetch(`https://trans.ella-peeters.me/api/users/${response.data.id}`, {
        		method: 'PUT',
        		credentials: 'include',
        		headers: { 'Content-Type': 'application/json' },
        		body: JSON.stringify(body)
    		});
		const jsonResponse = await res.json();
		provideUserFeedback(jsonResponse);
	})

}

export const renderProfile = () => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between ">
						<p class="text-xl mb-8" id="">Edit your profile and account settings.</p>

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
}
