/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./index.html',
		'./src/**/*.{ts,tsx,js,jsx,html}',
	],
	theme: {
		extend: {
			fontFamily: {
				roboto: ["Roboto", "sans-serif"],
			},
			colors: { 'primary-background': '#0E0012', 'primary': '#6D43FF' },
			container: {
				center: true,
			},
			width: {
				500: '500px'
			},
			backgroundImage: {
        		'hero-pattern': "url('/public/Group3.svg')",
      		},
			dropShadow: {
				//'purple-ds': '0 4px 30px rgba(109,67,255,100)',
				'3xl': '0 4px 30px rgba(109, 67, 255, 1)',

			},
		},
	},
	plugins: [],
};

