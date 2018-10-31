from __future__ import absolute_import

import logging

from requests.exceptions import RequestException

from sentry.models import SentryAppInstallation
from sentry.tasks.base import instrumented_task, retry

logger = logging.Logger('sentry.tasks.app_platform')


@instrumented_task(
    name='sentry.tasks.app_platform.installation_webhook',
    queue='integrations',  # Sharing this for now. Should it have its own?
    default_retry_delay=(60 * 5),  # 5 minutes
    max_retries=3,
)
@retry(on=(RequestException, ))
def installation_webhook(installation_id):
    from sentry.mediators.sentry_app_installations import InstallationNotifier

    try:
        install = SentryAppInstallation.objects.get(id=installation_id)
    except SentryAppInstallation.DoesNotExist:
        logger.info(
            'installation_webhook.missing_installation',
            extra={
                'installation_id': installation_id,
            },
        )
        return

    InstallationNotifier.run(install=install)
