import { router, navigateTo } from './router.js';

const ping = async () => {
	const id = (await (await fetch('/api/whoami', { method: 'GET' })).json()).id;
	if (id === -1) return;
	await fetch(`/api/users/${id}/ping`, { method: 'PUT' });
}

document.addEventListener("DOMContentLoaded", () => {
	router();

	ping();
	setInterval(ping, 60_000);
});

// Event delegation for all `<a>` elements
document.body.addEventListener("click", (event) => {
	const target = (event.target as HTMLElement).closest("a[data-link]");

	if (target && target instanceof HTMLAnchorElement) {
		event.preventDefault();
		navigateTo(target.getAttribute("href")!);
	}
});
