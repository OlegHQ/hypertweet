import { createDataLayer } from "../data";
import { ScrapingContext } from "../scraping/context";

export async function setupBackgroundApp() {
  const dataLayer = await createDataLayer();
  let cnt = 0;
  return {
    dataLayer,
    scraping: new ScrapingContext(),
    testStuff: async () => {
      return ++cnt;
    },
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
