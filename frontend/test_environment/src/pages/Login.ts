import { renderNavBar } from '../components/NavBar.js'
import { renderFooter } from '../components/Footer.js'
import { navigateTo } from '../../router.js'
import { togglePassword } from '../tools/helper.js';

declare const axios: any;
declare const Swal: any;

export const attachLoginFormListener = () => {
	const loginForm = document.querySelector('#loginForm');
	const showPasswordIcon = document.querySelector(".lucide-eye-icon");

	if (showPasswordIcon)
	{
		showPasswordIcon.addEventListener('click', () => {
		togglePassword();
	});
    }

	loginForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const loginForm = document.querySelector('#loginForm') as HTMLFormElement;
		const formData = new FormData(loginForm);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		try
		{
			const response = await axios.post('https://trans.ella-peeters.me/api/login', 
			{
				email: String(email),
				password: String(password),
			},
			{
				headers:
				{
					'Content-Type': 'application/json'
				}
			})
			sessionStorage.setItem('loginSuccess', 'true');
			navigateTo('/safe/dashboard');
		} catch (error)
		{
			const errorMessage = error?.response?.data?.error || "Something went wrong. Try again later!";

			Swal.fire({
				title: 'Error!',
				text: errorMessage,
				icon: 'error',
			});
		}

	});
};

export async function renderLogin(): Promise<string> {

	let isLoggedIn = false;

	try {
		const res = await axios.get('https://trans.ella-peeters.me/api/users/verifytoken', {
			withCredentials: true
		});

		if (res.data.message === "OK") {
			isLoggedIn = true;
		}
	} catch (err) {
		console.warn("User is not logged in or token is invalid:", err);
	}


	return `
  	${renderNavBar(isLoggedIn)}
	  <section class="bg-hero-pattern text-white bg-cover bg-top w-full">
		<div class="container px-5 md:px-10 h-screen flex items-center justify-center">
			<div class="px-6 flex flex-col items-center bg-primary-background rounded-xl w-96">
					<h2 class="mb-5 mt-7">Enter your login details</h2>
					<form class="flex flex-col gap-2 w-72" id="loginForm">
						<label for="email" class="text-base">Email</label>
						<input class="h-10 rounded text-black" type="email" id="email" name="email">
						<label for="password" class="text-base">Password</label>
						<div class="flex items-center gap-2">
							<input class="h-10 w-11/12 rounded text-black" type="password" id="password" name="password">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
						</div>
						<button class="h-10 w-full mt-10 text-base md:text-base text-white bg-primary my-2 py-3 px-6 rounded-md justify-center flex items-center whitespace-nowrap hover:text-primary hover:bg-white" type="submit">Login</button>

						<button class="h-10 w-full mt-1 mb-4 text-base md:text-base text-white bg-primary my-6 py-3 px-6 rounded-md justify-center flex items-center whitespace-nowrap hover:text-primary hover:bg-white" type="button" onclick="window.location.href='/auth';">Login with Google</button>
					</form>
					<p class="mb-10 text-base" data-link>Don't have an account? Click <a class="underline text-primary pointer" href="/safe/register" data-link>here</a> to register</p>
			</div>
		</div>
	  </section>
	${renderFooter()}
  `;
}
