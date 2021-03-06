import PropTypes from 'prop-types';
import React from 'react';
import {t} from 'app/locale';
import styled from 'react-emotion';

import AsyncComponent from 'app/components/asyncComponent';
import Button from 'app/components/button';
import {PanelItem} from 'app/components/panels';
import {promptsUpdate} from 'app/actionCreators/prompts';

const STEPS = {
  tag: t('Tag an error'),
  repo: t('Link to a repo'),
  commit: t('Associate commits'),
  deploy: t('Tell sentry about a deploy'),
};

class ReleaseProgress extends AsyncComponent {
  static contextTypes = {
    organization: PropTypes.object,
    project: PropTypes.object,
    router: PropTypes.object,
  };

  getEndpoints() {
    let {project, organization} = this.context;
    let data = {
      organization_id: organization.id,
      project_id: project.id,
      feature: 'releases',
    };
    return [
      ['promptsActivity', '/promptsactivity/', {data}],
      [
        'setupStatus',
        `/projects/${organization.slug}/${project.slug}/releases/completion/`,
      ],
    ];
  }
  onRequestSuccess({stateKey, data, jqXHR}) {
    if (stateKey === 'promptsActivity') {
      this.showBar(data);
    } else if (stateKey === 'setupStatus') {
      this.getRemainingSteps(data);
    }
  }

  getRemainingSteps(setupStatus) {
    let remainingSteps;
    if (setupStatus) {
      remainingSteps = setupStatus
        .filter(step => step.complete === false)
        .map(displayStep => STEPS[displayStep.step]);

      this.setState({
        remainingSteps,
      });
    }
  }

  showBar({data} = {}) {
    let show;
    if (data && data.snoozed_ts) {
      // check if more than 3 days have passed since snooze
      let now = Date.now() / 1000;
      let snoozingTime = (now - data.snoozed_ts) / (60 * 24);
      show = snoozingTime > 3 ? true : false;
    } else if (data && data.dismissed_ts) {
      show = false;
    } else {
      show = true;
    }

    this.setState({showBar: show});
  }

  handleClick(action) {
    let {project, organization} = this.context;

    let params = {
      projectId: project.id,
      organizationId: organization.id,
      feature: 'releases',
      status: action,
    };
    promptsUpdate(this.api, params).then(this.setState({showBar: false}));
  }

  renderBody() {
    let {remainingSteps, showBar} = this.state;
    if (!remainingSteps || !showBar) {
      return null;
    }
    return (
      <PanelItem>
        <div className="col-sm-6">
          <div>
            <h4 className="text-light"> {t("Releases aren't 100% set up")}</h4>
            <StyledBar>
              <StyledSlider />
            </StyledBar>
            <a href="https://docs.sentry.io/learn/releases/">{t('Next steps:')}</a>

            <ul>
              {this.state.remainingSteps.map((step, i) => {
                return <li key={i}>{step}</li>;
              })}
            </ul>
          </div>
        </div>

        <div className="col-sm-6">
          <div className="pull-right">
            <StyledButton
              className="text-light"
              onClick={() => this.handleClick('dismissed')}
              size="large"
              data-test-id="dismissed"
            >
              {t('Dismiss')}
            </StyledButton>
            <StyledButton
              className="text-light"
              onClick={() => this.handleClick('snoozed')}
              size="large"
              data-test-id="snoozed"
            >
              {t('Remind Me Later')}
            </StyledButton>
          </div>
        </div>
      </PanelItem>
    );
  }
}

const StyledButton = styled(Button)`
  margin: 5px;
`;

const StyledBar = styled.div`
  background: #767676;
  width: 100%;
  height: 15px;
  float: right;
  margin-right: 0px;
  margin-bottom: 10px;
  border-radius: 20px;
  position: relative;
`;

const StyledSlider = styled.div`
  height: 100%;
  width: 50%;
  background: #7ccca5;
  padding-right: 0;
  border-radius: inherit;
  box-shadow: 0 2px 1px rgba(0, 0, 0, 0.08);
  position: absolute;
  bottom: 0;
  left: 0;
`;
export default ReleaseProgress;
