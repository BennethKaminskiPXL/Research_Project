import { browser } from 'k6/experimental/browser';
import {sleep} from 'k6';

export const options = {
  scenarios: {
    fetchGraphQLScenario: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      exec: 'fetchRest',
      options: {
        browser: {
          type: 'chromium',
        },
      },
      tags: { name: 'fetchRest' },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export async function fetchRest() {
  const page = browser.newPage();

  try {
    await page.goto('http://localhost:4000/index.html');
    const buttonSelector = 'button#fetchRESTMovieWithParams';

    // Wait for the button to be visible
    await page.waitForSelector(buttonSelector);

    // Click the button
    await page.click(buttonSelector);

    // Wait for the page to finish loading or for a specific navigation event to occur
    await page.waitForNavigation();
  } finally {
    page.close();
  }
}