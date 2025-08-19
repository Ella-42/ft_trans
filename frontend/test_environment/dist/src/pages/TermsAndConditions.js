import { renderNavBar } from '../components/NavBar.js';
import { renderFooter } from '../components/Footer.js';
export async function renderTermsAndConditions() {
    let isLoggedIn = false;
    try {
        const res = await axios.get('https://trans.ella-peeters.me/api/users/verifytoken', {
            withCredentials: true
        });
        if (res.data.message === "OK") {
            isLoggedIn = true;
        }
    }
    catch (err) {
        console.warn("User is not logged in or token is invalid:", err);
    }
    return `
	<section class="flex flex-col bg-primary-background min-h-screen text-white">
		${renderNavBar(isLoggedIn)}
			<main class="flex-1 container px-5 py-10 mx-auto max-w-4xl">
				<h1 class="text-4xl font-bold mb-8 text-primary">Terms of Service – Retropong</h1>

				<section class="space-y-6 text-white">
          				<div>
						<p>Last updated: August 19, 2025</p>
        					<h2 class="text-2xl font-semibold mb-2">1. Definitions</h2>
            					<p class="pl-3"><strong>Platform/website:</strong> Refers to the web application Retropong.</p>
            					<p class="pl-3"><strong>User:</strong> Any individual who registers and/or uses the services of Retropong.</p>
            					<p class="pl-3"><strong>We, us, our:</strong> Refers to the owners/operators of Retropong.</p>
            					<p class="pl-3"><strong>Game:</strong> Refers to the digital Pong game available on the website.</p>
          				</div>

          				<div>
            					<h2 class="text-2xl font-semibold mb-2">2. Acceptance of Terms</h2>
            					<h3 class="text-lg font-medium">2.1 General</h3>
            					<p class="pl-3">By accessing or using Retropong, you agree to be bound by these Terms of Service. If you do not agree with these terms, you must refrain from using the platform.</p>

            					<h3 class="text-lg font-medium mt-3">2.2 Modifications</h3>
            					<p class="pl-3">We reserve the right to change or update these Terms at any time. The latest version will always be available on this page. Continued use of the platform after changes implies acceptance of the updated terms.</p>
          				</div>

          				<div>
            					<h2 class="text-2xl font-semibold mb-2">3. User Accounts</h2>
            					<h3 class="text-lg font-medium">3.1 Account Registration</h3>
            					<p class="pl-3">To use the multiplayer features of Retropong, you must register and create an account. You agree to provide accurate, current, and complete information during the registration process. The information we collect is:</p>
            					<ul class="list-disc ml-6 mt-3 mb-3">
              						<li>Username</li>
              						<li>Email (hashed)</li>
              						<li>Password (hashed)</li>
            					</ul>
						<p class="pl-3">All emails and passwords are hashed before being saved. This means that we do not keep your password and email as plain text data and even we cannot see what they are. The username, email address and password can be changed once the user is logged in.</p>

            					<h3 class="text-lg font-medium mt-3">3.2 Account Security</h3>
            					<p class="pl-3">You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately if you suspect unauthorized access to your account.</p>

            					<h3 class="text-lg font-medium mt-3">3.3 Minimum Age Requirement</h3>
            					<p class="pl-3">By registering, you confirm that you are of legal age under your jurisdiction's laws to enter into binding agreements. Users under 16 must have parental or guardian consent.</p>

            					<h3 class="text-lg font-medium mt-3">3.4 Verification</h3>
            					<p class="pl-3">We reserve the right to verify your account information if we suspect any inaccuracies or misuse.</p>

            					<h3 class="text-lg font-medium mt-3">3.5 Integrity of Information</h3>
            					<p class="pl-3">Users may not impersonate others or provide false information. We reserve the right to suspend or terminate accounts that violate this rule.</p>

            					<h3 class="text-lg font-medium mt-3">3.6 Privacy</h3>
            					<p class="pl-3">All personal information is handled according to our <a href="https://trans.ella-peeters.me/safe/privacy-policy" class="text-primary underline">Privacy Policy</a>.</p>

            					<h3 class="text-lg font-medium mt-3">3.7 Access</h3>
            					<p class="pl-3">After successful registration, you gain access to platform features such as matchmaking, gameplay, stats, and leaderboards.</p>

            					<h3 class="text-lg font-medium mt-3">3.8 Consent</h3>
            					<p class="pl-3">By registering, you agree to be bound by these Terms of Service, our <a href="https://trans.ella-peeters.me/safe/privacy-policy" class="text-primary underline">Privacy Policy</a>, and all applicable platform rules.</p>
          				</div>

          				<div>
            					<h2 class="text-2xl font-semibold mb-2">4. Use of the Platform</h2>
            					<h3 class="text-lg font-medium mt-3">4.1 Purpose</h3>
	    					<p class="pl-3">Retropong is a platform that allows users to play the Pong game against other users online for recreational purposes.</p>
            					<h3 class="text-lg font-medium mt-3">4.2 Independent Users</h3>
    						<p class="pl-3">Users play independently and are not affiliated with us in any employment, partnership, or agent relationship.</p>
            					<h3 class="text-lg font-medium mt-3">4.3 User Responsibility</h3>
	    					<p class="pl-3">You are solely responsible for your actions on the platform, including your interactions with other users.</p>
             					<h3 class="text-lg font-medium mt-3">4.4 No Performance Guarantee</h3>
		     				<p class="pl-3">We do not guarantee uninterrupted access, performance, or success in gameplay. The platform is offered “as is.”</p>
            					<h3 class="text-lg font-medium mt-3">4.5 Limitation of Liability</h3>
		    				<p class="pl-3">We are not liable for any damages resulting from your use of the platform. Use is at your own risk.</p>
          				</div>

          				<div>
            					<h2 class="text-2xl font-semibold mb-2">5. Conduct and Community Rules</h2>
            					<h3 class="text-lg font-medium mt-3">5.1 Fair Play</h3>
		    				<p class="pl-3">Bots, cheats, and exploits are prohibited.</p>
            					<h3 class="text-lg font-medium mt-3">5.2 Respectful Behavior</h3>
		    				<p class="pl-3">Offensive or harassing behavior may result in bans.</p>
            					<h3 class="text-lg font-medium mt-3">5.3 Reporting Misconduct</h3>
							<p class="pl-3">Report violations to <a href="mailto:EllaP.jobs@gmail.com" class="text-primary underline">EllaP.jobs@gmail.com</a>.</p>
          				</div>

          				<div>
            					<h2 class="text-2xl font-semibold mb-2">6. Account Termination</h2>
            					<h3 class="text-lg font-medium mt-3">6.1 Voluntary Termination</h3>
		    				<p class="pl-3">You may delete your account permanently from your profile.</p>
            					<h3 class="text-lg font-medium mt-3">6.2 Suspension</h3>
		    				<p class="pl-3">We may suspend accounts that break the rules.</p>
            					<h3 class="text-lg font-medium mt-3">6.3 No Data Recovery</h3>
		    				<p class="pl-3">Deleted accounts cannot be recovered.</p>
            					<h3 class="text-lg font-medium mt-3">6.4 Inactive Accounts</h3>
		    				<p class="pl-3">We may remove accounts inactive for over 12 months.</p>
            					<h3 class="text-lg font-medium mt-3">6.5 Retention</h3>
		    				<p class="pl-3">Some data may be retained for legal compliance.</p>
          				</div>

          				<div>
								<h2 class="text-2xl font-semibold mb-2">7. Privacy and Cookies</h2>
            					<p class="pl-3">For data and cookie usage, please see our <a href="https://trans.ella-peeters.me/safe/privacy-policy" class="text-primary underline">Privacy Policy</a> and <a href="https://trans.ella-peeters.me/safe/cookie-policy" class="text-primary underline">Cookie Policy</a>.</p>
          				</div>
        			</section>
      			</main>
		${renderFooter()}
	</section>
`;
}
