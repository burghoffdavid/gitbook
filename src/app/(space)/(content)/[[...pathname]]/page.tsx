import { CustomizationHeaderPreset, CustomizationThemeMode } from '@gitbook/api';
import { Metadata, Viewport } from 'next';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

import { PageAside } from '@/components/PageAside';
import { PageBody, PageCover } from '@/components/PageBody';
import { PageHrefContext, absoluteHref, pageHref } from '@/lib/links';
import { getPagePath } from '@/lib/pages';
import { ContentRefContext } from '@/lib/references';
import { tcls } from '@/lib/tailwind';

import { PagePathParams, fetchPageData, getPathnameParam } from '../../fetch';

export const runtime = 'edge';

/**
 * Fetch and render a page.
 */
export default async function Page(props: { params: PagePathParams }) {
    const { params } = props;

    // Redirects to the lowercase version of the path if it contains uppercase characters
    const pathname = getPathnameParam(params);
    const lowerCasePathname = pathname.toLowerCase();
    if (pathname !== lowerCasePathname) {
        redirect(absoluteHref(lowerCasePathname));
    }

    const { contentTarget, space, customization, pages, page, document } =
        await fetchPageData(params);
    const linksContext: PageHrefContext = {};

    if (!page) {
        notFound();
    } else if (getPagePath(pages, page) !== pathname) {
        redirect(pageHref(pages, page, linksContext));
    }

    const withTopHeader = customization.header.preset !== CustomizationHeaderPreset.None;
    const withFullPageCover = !!(
        page.cover &&
        page.layout.cover &&
        page.layout.coverSize === 'full'
    );
    const withPageFeedback = customization.feedback.enabled;

    const contentRefContext: ContentRefContext = {
        space,
        revisionId: contentTarget.revisionId,
        pages,
        page,
    };

    return (
        <>
            {withFullPageCover && page.cover ? (
                <PageCover as="full" page={page} cover={page.cover} context={contentRefContext} />
            ) : null}
            <div className={tcls('flex', 'flex-row')}>
                <PageBody
                    space={space}
                    contentTarget={contentTarget}
                    customization={customization}
                    context={contentRefContext}
                    page={page}
                    document={document}
                    withPageFeedback={
                        // Display the page feedback in the page footer if the aside is not visible
                        withPageFeedback && !page.layout.outline
                    }
                />
                {page.layout.outline ? (
                    <PageAside
                        space={space}
                        customization={customization}
                        page={page}
                        document={document}
                        withHeaderOffset={withTopHeader}
                        withFullPageCover={withFullPageCover}
                        withPageFeedback={withPageFeedback}
                        context={contentRefContext}
                    />
                ) : null}
            </div>
        </>
    );
}

export async function generateViewport({ params }: { params: PagePathParams }): Promise<Viewport> {
    const { customization } = await fetchPageData(params);
    return {
        colorScheme: customization.themes.toggeable
            ? customization.themes.default === CustomizationThemeMode.Dark
                ? 'dark light'
                : 'light dark'
            : customization.themes.default,
    };
}

export async function generateMetadata({ params }: { params: PagePathParams }): Promise<Metadata> {
    const { space, page, customization, collection } = await fetchPageData(params);
    if (!page) {
        notFound();
    }

    return {
        title: [page.title, customization.title ?? space.title, collection?.title]
            .filter(Boolean)
            .join(' | '),
        description: page.description ?? '',
        openGraph: {
            images: [
                customization.socialPreview.url ?? absoluteHref(`~gitbook/ogimage/${page.id}`),
            ],
        },
    };
}