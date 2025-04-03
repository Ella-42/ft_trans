import { renderNavBar } from '../components/NavBar.js'
import { renderHeroSection } from '../components/HeroSection.js'
import { renderFeaturesSection } from '../components/Features.js'
import { renderFooter } from '../components/Footer.js'

export function renderHomePage(): string {

  return `
	  ${renderNavBar()}
	  ${renderHeroSection()}
	  ${renderFeaturesSection()}
	  ${renderFooter()}
  `;
}
