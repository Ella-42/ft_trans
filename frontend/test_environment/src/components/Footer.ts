export function renderFooter(): string {
	return `
		<nav class="bg-primary-background -mt-2">
			<div class="container px-5 md:px-10">
				<div class="flex flex-col md:flex-row md:justify-end items-center pt-6 pb-6">
					<a data-link href="/terms-conditions" class="text-xl md:text-base py-2 px-3 block text-white hover:text-gray-400">Terms and conditions</a>
					<a data-link href="/privacy-policy" class="text-xl md:text-base py-2 px-3 block text-white hover:text-gray-400">Privacy policy</a>
					<a data-link href="/cookie-policy" class="link text-xl md:text-base py-2 px-3 block text-white hover:text-gray-400">Cookie policy</a>
				</div>
			</div>
		</nav>
  `;
}
