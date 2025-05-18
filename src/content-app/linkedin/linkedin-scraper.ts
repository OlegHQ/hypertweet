import type { LinkedInProfile } from "src/background-app/domain";

const linkedInRules = {
  fullName: ".artdeco-card h1",
  description: `.artdeco-card:nth-child(1) .ph5 div[data-generated-suggestion-target^="urn:li:fsu_profileActionDelegate"]`,
  location:
    ".artdeco-card span.text-body-small.inline.t-black--light.break-words",
  experiencePosition: `[data-field="experience_company_logo"].full-width div.full-height span[aria-hidden="true"]`,
  experienceCompany: `[data-field="experience_company_logo"].full-width span.t-normal:nth-child(2) span[aria-hidden="true"]`,
};

export class LinkedInScraper {
  async scrapeLinkedInProfile() {
    const getTextContent = (selector: string) =>
      document.querySelector(selector)?.textContent?.trim() || "";

    const getPositions = () => {
      const positionElements = document.querySelectorAll(
        linkedInRules.experiencePosition
      );
      return Array.from(positionElements).map(
        (el) => el.textContent?.trim() || ""
      );
    };

    const getCompanies = () => {
      const companyElements = document.querySelectorAll(
        linkedInRules.experienceCompany
      );
      return Array.from(companyElements).map(
        (el) => (el.textContent?.trim() || "").split("·")[0]?.trim() ?? "n/a"
      );
    };

    const profile: LinkedInProfile = {
      name: getTextContent(linkedInRules.fullName),
      description: getTextContent(linkedInRules.description),
      location: getTextContent(linkedInRules.location),
      positions: Array.from(new Set(getPositions())).filter(
        (x) => x != "" && x != "n/a"
      ),
      companies: Array.from(new Set(getCompanies())).filter(
        (x) => x != "" && x != "n/a"
      ),
    };

    return profile;
  }
}
