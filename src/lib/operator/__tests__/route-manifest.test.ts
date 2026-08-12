import { createOperatorLaunchHref, createRouteVisibleContext, resolveOperatorRoute } from '@/lib/operator/route-manifest';

const currentConsolePages = [
  '/', '/admin', '/admin/users', '/platform', '/platform/content', '/platform/content/example', '/platform/economics', '/platform/enrichment', '/platform/feed-integrity', '/platform/feed-recovery', '/platform/intelligence', '/platform/intelligence/analytics', '/platform/intelligence/embeddings', '/platform/intelligence/flags', '/platform/intelligence/media-value', '/platform/intelligence/preview', '/platform/intelligence/ranking', '/platform/media', '/platform/media/example', '/platform/media/atomization', '/platform/media/circulation', '/platform/media/finding', '/platform/media/redundancy', '/platform/media/sources', '/platform/media/sources/new', '/platform/media-studio', '/platform/media-studio/example', '/platform/moderation', '/platform/news', '/platform/news/circulation', '/platform/news/finding', '/platform/operations', '/platform/operator', '/platform/pipeline', '/platform/quality', '/platform/real-experience', '/platform/retention', '/platform/sources', '/platform/sources/example', '/platform/sources/new', '/platform/storage', '/platform/system-health', '/platform/topics',
];

describe('Operator route manifest', () => {
  it.each(currentConsolePages)('maps current Console route %s', (path) => {
    expect(resolveOperatorRoute(path)).toBeDefined();
  });

  it('creates browser context as intent only', () => {
    expect(createRouteVisibleContext('/platform/feed-recovery')).toEqual(expect.objectContaining({ domain: 'feed_recovery', filters: {}, subjects: [] }));
    expect(resolveOperatorRoute('/platform/media/sources')).toEqual(expect.objectContaining({ domain: 'media_sources' }));
    expect(resolveOperatorRoute('/platform/media/atomization')).toEqual(expect.objectContaining({ domain: 'atomization' }));
    expect(resolveOperatorRoute('/platform/media/finding')).toEqual(expect.objectContaining({ domain: 'media_sources', canonical_path: '/platform/media/sources' }));
  });

  it('derives only a stable route ID for object pages', () => {
    expect(createRouteVisibleContext('/platform/sources/source-123')).toEqual(expect.objectContaining({
      domain: 'sources',
      view: 'detail',
      subjects: [{ type: 'sources_record', id: 'source-123' }],
    }));
    expect(createRouteVisibleContext('/platform/media')).toEqual(expect.objectContaining({ subjects: [] }));
  });

  it('serializes only typed navigation hints for a contextual launch', () => {
    const context = createRouteVisibleContext('/platform/feed-integrity', {
      subjects: [{ type: 'news_window', id: 'today' }],
      selection: { mode: 'explicit', ids: ['today'], count: 1 },
    });
    expect(context).toBeDefined();
    expect(createOperatorLaunchHref(context!, 'resolve')).toBe('/platform/operator?domain=feed_integrity&view=cockpit&intent=resolve&subject_type=news_window&subject_id=today&selection_id=today');
  });

});
