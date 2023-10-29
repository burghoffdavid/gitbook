import { SpaceContent } from '@/components/SpaceContent';
import { pageHref } from '@/lib/links';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PagePathParams, fetchPageData, getPagePath } from '../fetch';
import { api } from '@/lib/api';

/**
 * Fetch and render a page.
 */
export default async function Page(props: { params: PagePathParams }) {
    const { params } = props;

    const { space, revision, page, ancestors } = await fetchPageData(props.params);

    if (!page) {
        notFound();
    } else if (page.path !== getPagePath(params)) {
        redirect(pageHref(page.path));
    }

    const {
        data: { document },
    } = await api().spaces.getPageInRevisionById(space.id, revision.id, page.id);

    return (
        <SpaceContent
            space={space}
            revision={revision}
            page={page}
            ancestors={ancestors}
            document={document}
        />
    );
}

export async function generateMetadata({ params }: { params: PagePathParams }): Promise<Metadata> {
    const { space, page } = await fetchPageData(params);
    if (!page) {
        notFound();
    }

    return {
        title: { default: page.title, template: `%s | ${space.title}` },
        description: page.description,
        generator: 'GitBook',
        openGraph: {
            images: [pageHref('.gitbook/ogimage/' + page.id)],
        },
    };
}