import { Browser, Page } from 'puppeteer';

declare global {
  var browser: Browser;
  var page: Page;
}