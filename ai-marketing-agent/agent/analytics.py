"""
Analytics module (Phase 7 - NOT YET IMPLEMENTED).

Planned behavior: read/write data/analytics/*.json records shaped like
    {video_id, platform, date, topic, views, likes, comments, shares,
     clicks, website_visits, signups, performance_score}
and eventually score which topics/hooks perform best, to feed back into
the Content Planner. Will ship with mock/sample data for testing before
any real publishing exists.
"""


def load_analytics(*args, **kwargs):
    raise NotImplementedError(
        "Analytics module is planned for Phase 7 and has not been built yet."
    )


def record_performance(*args, **kwargs):
    raise NotImplementedError(
        "Analytics module is planned for Phase 7 and has not been built yet."
    )
