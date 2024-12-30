'use client'

import { createChart } from 'lightweight-charts';
import {useUserStore} from "../../store/App.store";
import {useEffect, useRef} from "react";


export default function LocalApiChart({data}) {
    const containerRef = useRef();
    const { showAuthPage, setShowAuthPage } = useUserStore();

    useEffect(() => {
        const {live, bar} = data;
        const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
        const chart = createChart(containerRef.current as HTMLElement, chartOptions);
        const barSeries = chart.addBarSeries();
        const baselineSeries = chart.addBaselineSeries();

        const areaSeries = chart.addAreaSeries({
            lineColor: '#2962FF', topColor: '#2962FF',
            bottomColor: 'rgba(41, 98, 255, 0.28)',
        });
        areaSeries.setData(live);

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
            wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        });
        candlestickSeries.setData(bar);

        chart.timeScale().fitContent();
    }, [containerRef, data]);
    console.log(data);

    return (
        <div ref={containerRef} id={'chart_container'} className={'chart-container'}/>
    )
}
