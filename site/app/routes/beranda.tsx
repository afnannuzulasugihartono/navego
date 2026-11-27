// The legacy /beranda path is answered with a 301 by the worker; this route exists only so the build still emits the flat file the deploy workflow checks.

export { meta, default } from './index';