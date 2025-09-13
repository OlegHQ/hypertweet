import { Page } from "./models";

export abstract class Scraper {
	abstract readPage(): Promise<Page>
}

