import { renderNavBar } from '../components/NavBar.js';
import { renderFooter } from '../components/Footer.js';
export const attachRegisterFormListener = () => {
    const registerForm = document.querySelector('#registerForm');
    console.log("The atachRegisterFormListener runs");
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log("The event listener for the form is added");
        console.log("The event is: ", event.target.value);
    });
};
//setTimeout(attachRegisterFormListener, 0);
//export const sendDataToBackend = async (event) => {
//	event.preventDefault();
//	console.log("The event is: ", event);
// 	//const { data } = await axios.post('http://localhost:1919/login', {
// 	//		email, password, 
// 	//	}, {
// 	//		headers: {
// 	//			'Content-Type': 'application/json'
// 	//		}
// 	//	}
// 	//)
// 	//console.log("The data is: ", data);
// 	//return data;
// }
export const renderRegister = () => {
    return `
  	${renderNavBar()}
	  <section class="bg-hero-pattern text-white bg-cover bg-top w-full">
		<div class="container px-5 md:px-10 h-screen flex items-center justify-center">
			<div class="px-6 flex flex-col items-center bg-primary-background rounded-xl w-96">
					<h2 class="mb-5 mt-7">Register</h2>
					<form class="flex flex-col gap-2 w-72" id="registerForm" >
						<label for="email" class="text-base">Email</label>
						<input class="h-10 rounded text-black" type="email" id="email" name="email">
						<label for="password" class="text-base">Password</label>
						<input class="h-10 rounded text-black" type="password" id="password" name="password">
						<button class="h-10 w-full mt-10 text-base md:text-base text-white bg-primary my-8 py-3 px-6 rounded-md justify-center flex items-center whitespace-nowrap hover:text-primary hover:bg-white" type="submit">Register</button>
					</form>
					<p class="mb-10 text-base" data-link>Already have an account? Click <a class="underline text-primary pointer" href="/safe/login" data-link>here</a> to login</p>
			</div>
		</div>
	  </section>
	${renderFooter()}
  `;
};
