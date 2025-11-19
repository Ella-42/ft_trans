declare const Swal: any;

export const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
};

export const togglePassword = () => {
	const input = document.querySelector('#password') as HTMLInputElement;
	const inputConfirmation = document.querySelector('#passwordConfirmation') as HTMLInputElement | null;

	const shouldShow =
		input.type === 'password' || (inputConfirmation && inputConfirmation.type === 'password');

	input.type = shouldShow ? 'text' : 'password';

	if (inputConfirmation) {
		inputConfirmation.type = shouldShow ? 'text' : 'password';
	}
};

export const provideUserFeedback = (response) => {
	if (response.error)
	{
		Swal.fire (
		{
			title: 'Oops!',
			text: response.error,
			icon: 'error',
		})
	}
	else
	{
		Swal.fire (
		{
			title: 'Yay!',
			text: response.message,
			icon: 'success',
		})
	}
}

export const updateHeaderInNavbar = (title: string) => {
	let dashboardTitle: HTMLHeadingElement;
	while (!dashboardTitle) dashboardTitle = document.querySelector("#dashboard-title");
	dashboardTitle.textContent=title;
}
