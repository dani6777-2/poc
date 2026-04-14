import React from 'react';
import { Bar } from 'react-chartjs-2';
import Card from '../atoms/Card';
import ChannelRow from '../molecules/ChannelRow';
import InflationRow from '../molecules/InflationRow';

const SegmentationRadarPanel = ({ 
  data, 
  channelsChart, 
  chartOptions, 
  fmt 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <Card className="p-8 space-y-8 shadow-premium border border-border-base">
          <div>
             <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Capital Segmentation
             </h3>
          </div>
          
          {data?.channels?.length > 0 ? (
            <div className="space-y-8">
              <div className="h-[220px]">
                <Bar data={channelsChart} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="text-[9px] text-tx-muted uppercase font-black tracking-widest bg-tx-primary/[0.02] border-y border-border-base">
                    <tr>
                      <th className="py-4 px-5">Operator / Channel</th>
                      <th className="py-4 px-5 text-right w-32">Volume</th>
                      <th className="py-4 px-5 text-center w-24">Relative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base">
                     {data.channels.map((c, i) => (
                       <ChannelRow 
                        key={c.channel} 
                        item={c} 
                        color={channelsChart.datasets[0].borderColor[i % 7]} 
                        index={i}
                        fmt={fmt}
                       />
                     ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-20 gap-4 grayscale">
               <span className="text-5xl">🏪</span>
               <p className="text-[10px] font-black uppercase tracking-widest leading-loose">No processed transactions <br/> by integrated channels</p>
            </div>
          )}
       </Card>

       <Card className="p-8 space-y-8 relative overflow-hidden shadow-premium border border-border-base">
          <div 
            className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 animate-pulse pointer-events-none" 
          />
          
          <div>
             <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" /> Inflation Radar
             </h3>
             <p className="text-[10px] text-tx-muted font-bold uppercase mt-1 opacity-40 tracking-wider">Historical deviation metric in consumption assets</p>
          </div>

          {data?.inflation?.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-left table-fixed min-w-[360px]">
                <thead>
                  <tr className="text-[9px] font-black uppercase text-tx-muted/30 tracking-[0.25em] border-b border-border-base">
                    <th className="pb-4 w-1/2">Asset / SKU</th>
                    <th className="pb-4 text-right">Reference</th>
                    <th className="pb-4 text-right pr-4">Volatility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {data.inflation.map((item, i) => (
                    <InflationRow key={i} item={item} fmt={fmt} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-5 grayscale pt-10">
               <div className="w-12 h-12 rounded-full border border-border-base flex items-center justify-center text-xl shadow-inner">📡</div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] max-w-[240px] text-center leading-relaxed">Insufficient historical reference <br/> for inflationary radar</p>
            </div>
          )}
       </Card>
    </div>
  );
};

export default SegmentationRadarPanel;
