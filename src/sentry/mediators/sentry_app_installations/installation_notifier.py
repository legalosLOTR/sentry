from __future__ import absolute_import

from sentry.http import safe_urlopen, safe_urlread
from sentry.mediators import Mediator, Param
from sentry.utils.cache import memoize


class InstallationNotifier(Mediator):
    install = Param('sentry.models.SentryAppInstallation')

    def call(self):
        self._send_webhook()

    def _send_webhook(self):
        safe_urlread(
            safe_urlopen(self.sentry_app.webhook_url, json=self.body, timeout=5)
        )

    @property
    def body(self):
        return {
            'sentry_app': {
                'uuid': self.sentry_app.uuid,
                'slug': self.sentry_app.slug,
            },
            'uuid': self.install.uuid,
            'code': self.install.api_grant.code,
        }

    @memoize
    def sentry_app(self):
        return self.install.sentry_app
