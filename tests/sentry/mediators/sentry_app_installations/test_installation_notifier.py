from __future__ import absolute_import

from mock import patch

from sentry.mediators import sentry_apps
from sentry.mediators.sentry_app_installations import Creator, InstallationNotifier
from sentry.testutils import TestCase


class TestInstallationNotifier(TestCase):
    def setUp(self):
        super(TestInstallationNotifier, self).setUp()

        self.org = self.create_organization()

        self.sentry_app = sentry_apps.Creator.run(
            name='foo',
            organization=self.org,
            webhook_url='https://example.com',
            scopes=(),
        )

        self.install, _ = Creator.run(
            slug='foo',
            organization=self.org,
        )

    @patch('sentry.mediators.sentry_app_installations.notifier.safe_urlopen')
    def test_task_enqueued(self, safe_urlopen):
        InstallationNotifier.run(install=self.install)

        safe_urlopen.assert_called_once_with(
            'https://example.com',
            json={
                'sentry_app': {
                    'uuid': self.sentry_app.uuid,
                    'slug': self.sentry_app.slug,
                },
                'uuid': self.install.uuid,
                'code': self.install.api_grant.code,
            },
            timeout=5,
        )
