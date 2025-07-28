import { renderNavBar } from '../components/NavBar.js'
import { renderFooter } from '../components/Footer.js'

export function renderCookiePolicy(): string {

  return `
	<section class="flex flex-col bg-primary-background min-h-screen text-white">
		${renderNavBar()}
			<main class="flex-1 container px-5 py-10 mx-auto max-w-4xl">
				<h1 class="text-4xl font-bold mb-8 text-primary">Cookie policy – Retropong</h1>

				<section class="space-y-6 text-white">
					<div>
						<p class="mb-3">Last updated: July 25, 2025</p>
						<p class="pl-3 mb-2">This Cookie Policy explains how Retropong ("we", "us", or "our") uses cookies and similar technologies to recognize you when you visit our website, www…. It explains what these technologies are, why we use them, and what your rights are in relation to managing them.</p>
						<h2 class="text-2xl font-semibold mb-2">1. What Are Cookies?</h2>
						<p class="pl-3">Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently, to improve functionality, and to provide reporting information.</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">2. Cookies We Use</h2>
						<h3 class="text-lg font-medium">2.1 Essential Cookies</h3>
						<p class="pl-3">These cookies are necessary for the proper functioning of the platform. Without them, core features such as login and security may not work as intended.</p>
						<h3 class="text-lg font-medium">2.2 Analytics Cookies</h3>
						<p>We do not use cookies to track analytics on www….</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">3. Managing Cookies</h2>
						<h3 class="text-lg font-medium">3.1 Essential Cookies</h3>
						<p class="pl-3">Essential cookies are required for the platform to operate correctly and securely. These cannot be disabled via user settings.</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">4. Third-Party Cookies</h2>
						<p class="pl-3">Some cookies may be set by third-party providers such as Google. These cookies are subject to the privacy and cookie policies of those third parties. For more information, please review Google’s Privacy Policy.</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">5. Contact</h2>
						<p class="pl-3">If you have any questions or concerns about our use of cookies, please contact us at: info@tra</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">6. Changes to This Policy</h2>
						<p class="pl-3">We reserve the right to update this Cookie Policy at any time. Changes will take effect as soon as they are posted on this page. We encourage you to review this page periodically to stay informed.</p>
					</div>
				</section>
			</main>
		${renderFooter()}
	</section>
  `;
}
