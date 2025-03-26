import './style.css'

import { router, navigateTo } from './router'

document.addEventListener("DOMContentLoaded", () => {

	console.log("✅ DOM fully loaded, running router...");
	router();
});

// Event delegation for all `<a>` elements
document.body.addEventListener("click", (event) => {
	const target = (event.target as HTMLElement).closest("a[data-link]");
	if (target && target instanceof HTMLAnchorElement) {
		event.preventDefault();
		console.log(`🔗 Navigating to: ${target.href}`);
		navigateTo(target.getAttribute("href")!);
	}
});

//
// function loadApp()
// {
// 	app.innerHTML = renderHomePage();
//
// 	let linkElements = document.getElementsByTagName("a");
//
// 	for (let i = 0; i < linkElements.length; i++)
// 	{
// 		linkElements[i].addEventListener("click", (e) =>
// 			{
// 				e.preventDefault();
// 				console.log("This is a link");
// 				console.log("The value is: ", e.target.href);
// 			})
// 	}
//
// }
//
// loadApp();
