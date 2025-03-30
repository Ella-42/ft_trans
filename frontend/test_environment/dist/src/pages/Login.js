//import axios from 'axios'
import { renderNavBar } from '../components/NavBar.js';
import { renderFooter } from '../components/Footer.js';
// export const sendDataToBackend = async (email: string, password: string) => {
// 	const { data } = await axios.post('http://localhost:1919/login', {
// 			email, password, 
// 		}, {
// 			headers: {
// 				'Content-Type': 'application/json'
// 			}
// 		}
// 	)
// 	console.log("The data is: ", data);
// 	return data;
// }
export const renderLogin = () => {
    return `
  	${renderNavBar()}
	  <section class="bg-hero-pattern text-white bg-cover bg-top w-full">
		<div class="container px-5 md:px-10 h-screen flex items-center justify-center">
			<div class="px-6 flex flex-col items-center bg-primary-background rounded-xl w-96">
					<img class="h-28 mt-10 mb-10" src="../safe/public/pong-logo-1.svg"></img>
					<h2 class="mb-5">Enter your login details</h2>
					<form class="flex flex-col gap-2 w-72" id="loginForm">
						<label for="email">Email</label>
						<input class="h-10 rounded text-black" type="email" id="email" name="email">
						<label for="password">Password</label>
						<input class="h-10 rounded text-black" type="password" id="password" name="password">
						<button class="h-10 w-full mt-10 text-xl md:text-base text-white bg-primary my-8 py-3 px-6 rounded-md justify-center flex items-center whitespace-nowrap hover:text-primary hover:bg-white" type="submit">Login</button>
					</form>
					<p class="mb-10" data-link>Don't have an account? Click <a class="underline text-primary pointer" href="/register" data-link>here</a> to register</p>
			</div>
		</div>
	  </section>
	${renderFooter()}
  `;
};
