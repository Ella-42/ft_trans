import { renderNavBar } from '../components/NavBar'
import { renderHeroSection } from '../components/HeroSection'
import { renderFeaturesSection } from '../components/Features'
import { renderFooter } from '../components/Footer'

export function renderHomePage(): string {

  return `
	  ${renderNavBar()}
	  ${renderHeroSection()}
	  ${renderFeaturesSection()}
	  ${renderFooter()}
  `;
}
