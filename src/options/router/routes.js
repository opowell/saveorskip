import Home from './pages/Home';
import Indices from './pages/Indices';
import Link from './pages/Link';
import Links from './pages/Links';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Profiles from './pages/Profiles';
import Scraper from './pages/Scraper';
import Scrapers from './pages/Scrapers';
import ScrapingQueue from './pages/ScrapingQueue';
import Settings from './pages/Settings';
import Source from './pages/Source';
import Sources from './pages/Sources';

export default [
  {
    name: 'settings',
    path: '/settings',
    component: Settings,
  },
  {
    name: 'home',
    path: '/',
    component: Home,
  },
  {
    name: 'profile',
    path: '/profile/:id',
    component: Profile,
  },
  {
    name: 'profileLink',
    path: '/profile/:profileId/link/:linkId',
    component: Link,
  },
  {
    name: 'profileLinks',
    path: '/profile/:id/links',
    component: Links,
  },
  {
    name: 'profiles',
    path: '/profiles',
    component: Profiles,
  },
  {
    name: 'profileSources',
    path: '/profile/:id/sources',
    component: Sources,
  },
  {
    name: 'profileSource',
    path: '/profile/:profileId/sources/:sourceId',
    component: Source,
  },
  {
    name: 'scrapers',
    path: '/scrapers',
    component: Scrapers,
  },
  {
    name: 'logs',
    path: '/logs',
    component: Logs,
  },
  {
    name: 'indices',
    path: '/indices',
    component: Indices,
  },
  {
    name: 'scraping-queue',
    path: '/scraping-queue',
    component: ScrapingQueue,
  },
  {
    name: 'scraper',
    path: '/scrapers/:id',
    component: Scraper,
  },
];
