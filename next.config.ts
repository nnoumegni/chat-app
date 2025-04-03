import type { NextConfig } from "next";
import {PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD} from "next/constants";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
        ignoreDuringBuilds: true, // disables ESLint during 'next build'
    },
    typescript: {
        ignoreBuildErrors: true, // ⛔ disables type checking during build
    },
    distDir: 'build',
    output: 'export',
    assetPrefix: '/assets/chat/',
    images: {
        path: '/assets/chat/assets/images',
        loader: 'default',
    },
};

module.exports = (phase) => {
    const isProd = phase === PHASE_PRODUCTION_BUILD;

    return {
        /* config options here */
        eslint: {
            ignoreDuringBuilds: true, // disables ESLint during 'next build'
        },
        typescript: {
            ignoreBuildErrors: true, // ⛔ disables type checking during build
        },
        distDir: 'build',
        output: 'export',
        assetPrefix: isProd ? '/assets/chat/' : '',
        images: isProd ? {
            path: '/assets/chat/assets/images',
            loader: 'default',
        } : {},
    };
};
