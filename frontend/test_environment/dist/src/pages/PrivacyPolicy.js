import { renderNavBar } from '../components/NavBar.js';
import { renderFooter } from '../components/Footer.js';
export function renderPrivacyPolicy() {
    return `
  	<section class="flex flex-col bg-primary-background min-h-screen text-white">
		${renderNavBar()}
			<main class="flex-1 container px-5 py-10 mx-auto max-w-4xl">
				<h1 class="text-4xl font-bold mb-8 text-primary">Privacy Policy – Retropong</h1>

				<section class="space-y-6 text-white">
					<div>
						<p class="mb-3">Last updated: July 25, 2025</p>
						<h2 class="2-xl font-semibold mb-2">1. Definitions</h2>
						<p class="pl-3">Retropong (“we”, “us”, “our”, “the platform”) is an independent web application that allows users to play Pong games against each other. By using our platform, you agree to the practices described in this Privacy Policy, which outlines how we collect, use, store, and protect your personal information.
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">2. Information We Collect</h2>
						<h3 class="text-lg font-medium">2.1 Information You Provide</h3>
						<p class="pl-3">When you register for an account, we collect the following personal information:</p>
						<ul class="list-disc ml-6 mt-3 mb-3">
              						<li>Username</li>
              						<li>Email (hashed)</li>
              						<li>Password (hashed)</li>
            					</ul>
						<p class="pl-3">The email and password are hashed before being sent to the database so we do not store these values as plain text.</p>
						<h3 class="text-lg font-medium">2.2 Data Storage</h3>
						<p class="pl-3">All personal data is securely stored on servers located in Amsterdam and managed in accordance with European data protection standards, including the General Data Protection Regulation (GDPR).</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">3. Use of Data</h2>
						<h3 class="text-lg font-medium">3.1 Service Provision</h3>
						<p class="pl-3">We use your data to provide core platform functionality, including:</p>
						<ul class="list-disc ml-6 mt-1">
              						<li>Managing user accounts</li>
              						<li>Enabling multiplayer gameplay</li>
              						<li>Improving website performance</li>
            					</ul>
						<h3 class="text-lg font-medium">3.2 Communication</h3>
						<p class="pl-3">We may contact you by email for important updates, notifications, or service-related announcements.</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">4. Data Sharing and Disclosure</h2>
						<h3 class="text-lg font-medium">4.1 With Third Parties</h3>
						<p class="pl-3">We do not sell or rent your personal data. Data is only shared with third-party service providers where necessary for platform operations (e.g. server hosting).</p>
						<h3 class="text-lg font-medium">4.2 Legal Requirements</h3>
						<p class="pl-3">We may disclose your personal information if required to do so by law, or if necessary to protect our legal rights or comply with a legal obligation.</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">5. User Rights and Data Control</h2>
						<h3 class="text-lg font-medium">5.1 Your Rights</h3>
						<p class="pl-3">You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact us at <a href="mailto:EllaP.jobs@gmail.com " class="text-primary underline">info@ella-peeters.com</a> or access these features n the profile page once you are logged in.</p>
						<h3 class="text-lg font-medium">5.2 Data Retention</h3>
						<p class="pl-3">We retain your personal data for as long as your account is active or as necessary to provide you with services, unless a longer retention period is required by law.</p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">6. Data Security</h2>
						<p class="pl-3">We implement reasonable administrative, technical, and physical safeguards to protect your personal data against unauthorized access, misuse, loss, or alteration.</p>
 						<p class="pl-3">Passwords and email addresses are hashed before being stored in the database. </p>
					</div>
					<div>
						<h2 class="text-2xl font-semibold mb-2">7. Changes to this Privacy Policy</h2>
						<p class="pl-3">We may update this Privacy Policy from time to time. Changes will become effective upon publication on this page. We encourage you to review this policy periodically to stay informed.</p>
					</div>
				</section>

			</main>
		${renderFooter()}
	</section>
  `;
}
