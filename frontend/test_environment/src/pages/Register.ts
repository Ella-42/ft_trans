import { renderNavBar } from '../components/NavBar.js'
import { renderFooter } from '../components/Footer.js'
import { navigateTo } from '../../router.js'
import { togglePassword } from '../tools/helper.js';
import { emailValidation, registerPasswordValidation, usernameValidation } from '../tools/dataValidation.js'

declare const axios: any;

export const attachRegisterFormListener = () => {
	const registerForm = document.querySelector('#registerForm');
	const showPasswordIcon = document.querySelector(".lucide-eye-icon");
	const showPasswordIconConfirmation = document.querySelector(".lucide-eye-icon-confirmation");
	console.log("The atachRegisterFormListener runs");

	if (showPasswordIcon || showPasswordIconConfirmation)
	{
		showPasswordIcon.addEventListener('click', () => {
			togglePassword();
	});
		showPasswordIconConfirmation.addEventListener('click', () => {
			togglePassword();
		});
	}
	registerForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		console.log("The event listener for the form is added");
		console.log("The event is: ", event.target);

		const registerForm = document.querySelector('#registerForm') as HTMLFormElement;
		const formData = new FormData(registerForm);

		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const passwordConfirmation = formData.get('passwordConfirmation') as string;
		const nickName = formData.get('nickName') as string;

		if (!emailValidation(email)) return;
		if (!registerPasswordValidation(password, passwordConfirmation)) return;
		if (!usernameValidation(nickName)) return;

		try {
			const response = await axios.post('https://trans.ella-peeters.me/api/register', {
				email: String(email),
				password: String(password),
				name: String(nickName),
			}, {
				headers: {
					'Content-Type': 'application/json'
				}
			})
			console.log("The response after registering is: ", response);
			sessionStorage.setItem('registrationSuccess', 'true');
			navigateTo('/safe/login');

			
		} catch (error) {
			console.error("The error is: ", error);
		}

	});
};

export const renderRegister = (): string => {
	return `
  	${renderNavBar()}
	  <section class="bg-hero-pattern text-white bg-cover bg-top w-full">
		<div class="container px-5 md:px-10 h-screen flex items-center justify-center">
			<div class="px-6 flex flex-col items-center bg-primary-background rounded-xl w-96">
					<h2 class="mb-5 mt-7">Register</h2>
					<form class="flex flex-col gap-2 w-72" id="registerForm" >
						<label for="email" class="text-base">Email</label>
						<input class="h-10 rounded text-black" type="email" id="email" name="email">
						<label for="nickName" class="text-base">Nickname</label>
						<input class="h-10 rounded text-black" type="text" id="nickName" name="nickName">
						<label for="password" class="text-base">Password</label>
						<div class="flex items-center gap-2">
							<input class="h-10 w-11/12 rounded text-black" type="password" id="password" name="password">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
						</div>
						<label for="passwordConfirmation" class="text-base">Password confirmation</label>
						<div class="flex items-center gap-2">
							<input class="h-10 w-11/12 rounded text-black" type="password" id="passwordConfirmation" name="passwordConfirmation">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon-confirmation lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
						</div>
						<button class="h-10 w-full mt-10 text-base md:text-base text-white bg-primary my-8 py-3 px-6 rounded-md justify-center flex items-center whitespace-nowrap hover:text-primary hover:bg-white" type="submit">Register</button>
					</form>
					<p class="mb-10 text-base" data-link>Already have an account? Click <a class="underline text-primary pointer" href="/safe/login" data-link>here</a> to login</p>
			</div>
		</div>
	  </section>
	${renderFooter()}
  `;
}
