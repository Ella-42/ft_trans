import { renderNavBar } from '../components/NavBar.js'
import { renderFooter } from '../components/Footer.js'

export function renderTermsAndConditions(): string {

  return `
  	<section class="flex flex-col bg-primary-background h-screen">
	  	${renderNavBar()}
		<main class="flex-1 container px-5">
			<h1 class="text-white">This is the terms and conditions page</h1>
		</main>
		${renderFooter()}
	</section>
  `;
}
