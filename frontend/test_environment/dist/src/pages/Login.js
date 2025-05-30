import { renderNavBar } from '../components/NavBar.js';
import { renderFooter } from '../components/Footer.js';
import { navigateTo } from '../../router.js';
import { emailValidation, loginPasswordValidation } from '../tools/dataValidation.js';
export const attachLoginFormListener = () => {
    const loginForm = document.querySelector('#loginForm');
    console.log("The attachLoginFormListener runs");
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("The login function runs");
        const loginForm = document.querySelector('#loginForm');
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        console.log("The email is: ", email);
        console.log("The password is: ", password);
        if (!emailValidation(email))
            return;
        if (!loginPasswordValidation(password))
            return;
        try {
            console.log("test1");
            const response = await axios.post('https://trans.ella-peeters.me/api/login', {
                email: String(email),
                password: String(password),
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log("The reponse after logging in is: ", response);
            sessionStorage.setItem('loginSuccess', 'true');
            navigateTo('/safe/dashboard');
        }
        catch (error) {
            console.error("The error is: ", error);
        }
    });
};
export const renderLogin = () => {
    return `
  	${renderNavBar()}
	  <section class="bg-hero-pattern text-white bg-cover bg-top w-full">
		<div class="container px-5 md:px-10 h-screen flex items-center justify-center">
			<div class="px-6 flex flex-col items-center bg-primary-background rounded-xl w-96">
					<h2 class="mb-5 mt-7">Enter your login details</h2>
					<form class="flex flex-col gap-2 w-72" id="loginForm">
						<label for="email" class="text-base">Email</label>
						<input class="h-10 rounded text-black" type="email" id="email" name="email">
						<label for="password" class="text-base">Password</label>
						<input class="h-10 rounded text-black" type="password" id="password" name="password">
						<button class="h-10 w-full mt-10 text-base md:text-base text-white bg-primary my-2 py-3 px-6 rounded-md justify-center flex items-center whitespace-nowrap hover:text-primary hover:bg-white" type="submit">Login</button>
						<button class="h-10 w-full mt-1 mb-4 text-base md:text-base text-white bg-primary my-6 py-3 px-6 rounded-md justify-center flex items-center whitespace-nowrap hover:text-primary hover:bg-white" type="button" onclick="window.location.href='/auth';">Login with Google</button>
					</form>
					<p class="mb-10 text-base" data-link>Don't have an account? Click <a class="underline text-primary pointer" href="/safe/register" data-link>here</a> to register</p>
			</div>
		</div>
	  </section>
	${renderFooter()}
  `;
};
