import { useState } from 'react';
import { TotalPortafolioWidget } from '../components/widgets/TotalPortalioWidget';
import { CurrenciesWidget } from '../components/widgets/CurrenciesWidget';
import { PortafolioDistributionWidget } from '../components/widgets/PortafolioDistributionWidget';
import { WidgetConfig } from '../types/wigdet';

export function useWidgets() {
  const [widgets, setWidgets] = useState([
    {
      key: 'portfolio-value',
      label: 'Portfolio Value',
      width: 'w-full',
      component: TotalPortafolioWidget,
    },
  ]);

  const availableWidgets: WidgetConfig[] = [
    {
      key: 'portfolio-value',
      label: 'Portfolio Value',
      width: 'w-full',
      component: TotalPortafolioWidget,
    },
    {
      key: 'currency-breakdown',
      label: 'Currency Breakdown',
      width: 'w-146',
      component: CurrenciesWidget,
    },
    {
      key: 'currency-distribution',
      label: 'Currency Distribution',
      width: 'w-146',
      component: PortafolioDistributionWidget,
    },
  ];

  // const getWidget = (widget: string) => {
  //     return availableWidgets.find((w) => w.value === widget);
  // };

  // const getWidgetLabel = (widget: string) => {
  //     return getWidget(widget)?.label;
  // };

  return {
    widgets,
    setWidgets,
    availableWidgets,
  };
}
