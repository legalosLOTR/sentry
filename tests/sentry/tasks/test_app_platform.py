from __future__ import absolute_import

from mock import patch

from sentry.mediators import sentry_apps, sentry_app_installations
from sentry.tasks.app_platform import installation_webhook
from sentry.testutils import TestCase


class TestAppPlatformTasks(TestCase):
    def setUp(self):
        self.org = self.create_organization()

        self.sentry_app = sentry_apps.Creator.run(
            name='foo',
            organization=self.org,
            webhook_url='https://example.com',
            scopes=(),
        )

        self.install, _ = sentry_app_installations.Creator.run(
            slug='foo',
            organization=self.org,
        )

    @patch('sentry.mediators.sentry_app_installations.Notifier.run')
    def test_installation_webhook(self, run):
        with self.tasks():
            installation_webhook(self.install.id)

        run.assert_called_once_with(install=self.install)
