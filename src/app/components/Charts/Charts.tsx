// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from 'react';
import './Chart.scss';
import {ChartDataType} from "../../models/AssetType";

function TradingViewWidget({chartData}: {chartData: ChartDataType}) {
  const container = useRef();
  const {symbol, exchange} = chartData;

  console.log({chartData})

  useEffect(
      () => {
          const innerHTML = `
        {
          "autosize": true,
          "symbol": "${exchange}:${symbol}",
          "interval": "1",
          "timezone": "America/Los_Angeles",
          "theme": "light",
          "style": "1",
          "locale": "en",
          "allow_symbol_change": true,
          "calendar": false,
          "support_host": "https://www.tradingview.com"
        }`;

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = innerHTML;
        container.current.appendChild(script);
      },
      []
  );

  return (
      <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
        <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
      </div>
  );
}

export default memo(TradingViewWidget);
