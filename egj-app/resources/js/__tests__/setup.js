import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { router } from '@inertiajs/core';
import { afterEach, beforeEach, vi } from 'vitest';
import { setPageProps } from './helpers';

/*
 * Inertia: the real useForm / Link / router are used, so pages are tested with their actual
 * submit logic. Only two things are replaced:
 *  - usePage(): normally provided by the Inertia app shell, here driven by setPageProps()
 *  - Head: writes to <head> through the app shell, irrelevant in unit tests
 * Every request ends in router.visit(), which is spied (see helpers.lastVisit()).
 */
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal();
    const { currentPage } = await import('./helpers');
    return {
        ...actual,
        usePage: () => currentPage(),
        Head: () => null,
    };
});

// jsdom has no matchMedia; react-hot-toast uses it for prefers-reduced-motion
window.matchMedia = window.matchMedia || ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
}));

beforeEach(() => {
    setPageProps({});
    vi.spyOn(router, 'visit').mockImplementation(() => {});

    // Default: every fetch succeeds with an empty JSON body; tests override per case
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }));

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    globalThis.URL.revokeObjectURL = vi.fn();
    window.history.replaceState({}, '', '/dashboard');
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

afterEach(() => {
    cleanup();
});
