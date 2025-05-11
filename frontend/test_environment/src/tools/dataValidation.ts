declare const Swal: any;

const validateData = (data: string, pattern: RegExp): boolean => {
	return pattern.test(data);
}

const checkForForbiddenCharacters = (data: string, word: string): boolean => {
	if (validateData(data, /['";#\\]/))
	{
		Swal.fire(
		{
			title: 'Error!',
			text: "The " + word +  " contains one of the forbidden characters: (', \", ;, #, \\)",
			icon: 'error',
		})
		return true;
	}
	return false;
}

export const emailValidation = (data: string): boolean => {
	if (!data)
	{
		Swal.fire(
		{
			title: 'Error!',
			text: "The email field cannot be empty!",
			icon: 'error',
		})
		return false;
	}
	if (checkForForbiddenCharacters(data, "email"))
		return false;
	if (!validateData(data, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
	{
		Swal.fire(
		{
			title: 'Error!',
			text: 'The email is not in the correct format!',
			icon: 'error',
		})
		return false;
	}
	return true;
}
