/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StadiumProvider, useStadium } from './context/StadiumContext';
import { AppShell } from './components/AppShell';
import { SeatSetupModal } from './components/SeatSetupModal';
import { LandingPageView } from './components/LandingPageView';
import { TicketAuthView } from './components/TicketAuthView';
import { FanHomeView } from './components/FanHomeView';
import { StadiumMapView } from './components/StadiumMapView';
import { FoodFinderView } from './components/FoodFinderView';
import { AIConciergeView } from './components/AIConciergeView';
import { MatchCenterView } from './components/MatchCenterView';
import { HelpSafetyView } from './components/HelpSafetyView';
import { FanActivityView } from './components/FanActivityView';
import { OperatorDashboardView } from './components/OperatorDashboardView';

const MainRouter: React.FC = () => {
  const { role, fanTab } = useStadium();

  if (role === 'operator' || role === 'admin') {
    return <OperatorDashboardView />;
  }

  switch (fanTab) {
    case 'home':
      return <FanHomeView />;
    case 'map':
      return <StadiumMapView />;
    case 'food':
      return <FoodFinderView />;
    case 'concierge':
      return <AIConciergeView />;
    case 'match':
      return <MatchCenterView />;
    case 'safety':
      return <HelpSafetyView />;
    case 'activity':
      return <FanActivityView />;
    default:
      return <FanHomeView />;
  }
};

const RootExperience: React.FC = () => {
  const { showLanding, showTicketAuth } = useStadium();

  if (showTicketAuth) {
    return <TicketAuthView />;
  }

  if (showLanding) {
    return <LandingPageView />;
  }

  return (
    <>
      <AppShell>
        <MainRouter />
      </AppShell>
      <SeatSetupModal />
    </>
  );
};

export default function App() {
  return (
    <StadiumProvider>
      <RootExperience />
    </StadiumProvider>
  );
}
