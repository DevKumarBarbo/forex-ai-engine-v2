const express = require("express");
const app = express();

app.use(express.json());

// ==========================
// ENGINE FUNCTION
// ==========================
function analyzeMarket(input){

  const fcs = input.fcs || 0;
    const twelve = parseFloat(input.twelve || 0);
      const exchange = input.exchange || 0;
        const history = input.history || [];

          const prices = [fcs, twelve, exchange].filter(p => p > 0);

            // CORE
              const avg = prices.reduce((a,b)=>a+b,0)/prices.length;
                const sorted = [...prices].sort((a,b)=>a-b);
                  const median = sorted[Math.floor(sorted.length/2)];
                    const max = Math.max(...prices);
                      const min = Math.min(...prices);
                        const range = max - min;
                          const mid = (max + min)/2;

                            // STATS
                              const variance = prices.reduce((a,b)=>a+Math.pow(b-avg,2),0)/prices.length;
                                const std = Math.sqrt(variance);
                                  const skewness = prices.reduce((a,b)=>a+Math.pow((b-avg)/(std||1),3),0)/prices.length;
                                    const kurtosis = prices.reduce((a,b)=>a+Math.pow((b-avg)/(std||1),4),0)/prices.length;
                                      const zscores = prices.map(p => (p - avg)/(std || 1));

                                        // HISTORY
                                          const closes = history.map(c => parseFloat(c.close)).filter(x=>x);
                                            const highs = history.map(c => parseFloat(c.high)).filter(x=>x);
                                              const lows = history.map(c => parseFloat(c.low)).filter(x=>x);

                                                // TIME
                                                  const velocity = closes.slice(1).map((p,i)=> p - closes[i]);
                                                    const acceleration = velocity.slice(1).map((v,i)=> v - velocity[i]);

                                                      const avgSpeed = velocity.reduce((a,b)=>a+Math.abs(b),0)/(velocity.length || 1);
                                                        const avgAccel = acceleration.reduce((a,b)=>a+Math.abs(b),0)/(acceleration.length || 1);

                                                          // STRUCTURE
                                                            let structure = [];
                                                              for(let i=1;i<closes.length;i++){
                                                                  if(closes[i] > closes[i-1]) structure.push(1);
                                                                      else if(closes[i] < closes[i-1]) structure.push(-1);
                                                                          else structure.push(0);
                                                                            }

                                                                              let swings = 0;
                                                                                for(let i=2;i<closes.length;i++){
                                                                                    if(
                                                                                          (closes[i] > closes[i-1] && closes[i-1] < closes[i-2]) ||
                                                                                                (closes[i] < closes[i-1] && closes[i-1] > closes[i-2])
                                                                                                    ){
                                                                                                          swings++;
                                                                                                              }
                                                                                                                }

                                                                                                                  // MICROSTRUCTURE
                                                                                                                    const buyPressure = avg - min;
                                                                                                                      const sellPressure = max - avg;

                                                                                                                        let imbalance = 0;
                                                                                                                          if (buyPressure > sellPressure) imbalance = 1;
                                                                                                                            if (sellPressure > buyPressure) imbalance = -1;

                                                                                                                              const efficiency = 1 - (range / avg);

                                                                                                                                // HISTORY ANALYSIS
                                                                                                                                  const hist_high = Math.max(...highs);
                                                                                                                                    const hist_low = Math.min(...lows);
                                                                                                                                      const hist_range = hist_high - hist_low;

                                                                                                                                        const returns = closes.slice(1).map((c,i)=> (c - closes[i]) / closes[i]);

                                                                                                                                          let peak = closes[0];
                                                                                                                                            let max_drawdown = 0;
                                                                                                                                              for (let price of closes) {
                                                                                                                                                  if (price > peak) peak = price;
                                                                                                                                                      const dd = (peak - price) / peak;
                                                                                                                                                          if (dd > max_drawdown) max_drawdown = dd;
                                                                                                                                                            }

                                                                                                                                                              // MOMENTUM
                                                                                                                                                                const momentum = {
                                                                                                                                                                    raw: velocity,
                                                                                                                                                                        cumulative: velocity.reduce((a,b)=>a+b,0),
                                                                                                                                                                            strength: velocity.reduce((a,b)=>a+Math.abs(b),0)/(velocity.length || 1)
                                                                                                                                                                              };

                                                                                                                                                                                // VOLATILITY
                                                                                                                                                                                  const rollingVol = [];
                                                                                                                                                                                    for(let i=2;i<closes.length;i++){
                                                                                                                                                                                        const slice = closes.slice(i-2,i+1);
                                                                                                                                                                                            const mean = slice.reduce((a,b)=>a+b,0)/slice.length;
                                                                                                                                                                                                const varr = slice.reduce((a,b)=>a+Math.pow(b-mean,2),0)/slice.length;
                                                                                                                                                                                                    rollingVol.push(Math.sqrt(varr));
                                                                                                                                                                                                      }

                                                                                                                                                                                                        // SUPPORT / RESISTANCE
                                                                                                                                                                                                          const support = Math.min(...closes.slice(0,10));
                                                                                                                                                                                                            const resistance = Math.max(...closes.slice(0,10));

                                                                                                                                                                                                              // PATTERNS
                                                                                                                                                                                                                const patterns = [];
                                                                                                                                                                                                                  for(let i=2;i<closes.length;i++){
                                                                                                                                                                                                                      if(closes[i] > closes[i-1] && closes[i-1] > closes[i-2]) patterns.push(1);
                                                                                                                                                                                                                          if(closes[i] < closes[i-1] && closes[i-1] < closes[i-2]) patterns.push(-1);
                                                                                                                                                                                                                            }

                                                                                                                                                                                                                              // NORMALIZATION
                                                                                                                                                                                                                                const normalized = closes.map(p => (p - hist_low)/(hist_high - hist_low || 1));

                                                                                                                                                                                                                                  // BEHAVIOR
                                                                                                                                                                                                                                    const behavior = {
                                                                                                                                                                                                                                        aggression: avgSpeed * swings,
                                                                                                                                                                                                                                            stability: 1 - (swings / closes.length),
                                                                                                                                                                                                                                                expansion: hist_range / avg,
                                                                                                                                                                                                                                                    compression: range / hist_range
                                                                                                                                                                                                                                                      };

                                                                                                                                                                                                                                                        // MULTI TIMEFRAME
                                                                                                                                                                                                                                                          const avgArr = arr => arr.reduce((a,b)=>a+b,0)/arr.length;

                                                                                                                                                                                                                                                            const mtf = {
                                                                                                                                                                                                                                                                short_avg: avgArr(closes.slice(0,5)),
                                                                                                                                                                                                                                                                    medium_avg: avgArr(closes.slice(0,10)),
                                                                                                                                                                                                                                                                        long_avg: avgArr(closes.slice(0,20))
                                                                                                                                                                                                                                                                          };

                                                                                                                                                                                                                                                                            // ENTROPY
                                                                                                                                                                                                                                                                              const probabilities = prices.map(p => p / prices.reduce((a,b)=>a+b,0));
                                                                                                                                                                                                                                                                                const entropy = -probabilities.reduce((sum,p)=> sum + (p * Math.log2(p || 1)),0);

                                                                                                                                                                                                                                                                                  // AI MATRIX
                                                                                                                                                                                                                                                                                    const ai_matrix = closes.map((p,i)=>[
                                                                                                                                                                                                                                                                                        p,
                                                                                                                                                                                                                                                                                            velocity[i] || 0,
                                                                                                                                                                                                                                                                                                acceleration[i] || 0,
                                                                                                                                                                                                                                                                                                    normalized[i] || 0
                                                                                                                                                                                                                                                                                                      ]);

                                                                                                                                                                                                                                                                                                        const ai_vector = [
                                                                                                                                                                                                                                                                                                            avg, range, std, skewness, kurtosis,
                                                                                                                                                                                                                                                                                                                buyPressure, sellPressure,
                                                                                                                                                                                                                                                                                                                    avgSpeed, avgAccel,
                                                                                                                                                                                                                                                                                                                        swings, entropy
                                                                                                                                                                                                                                                                                                                          ];

                                                                                                                                                                                                                                                                                                                            return {
                                                                                                                                                                                                                                                                                                                                price: { avg, median, mid, max, min, range },
                                                                                                                                                                                                                                                                                                                                    stats: { variance, std, skewness, kurtosis, zscores },
                                                                                                                                                                                                                                                                                                                                        microstructure: { imbalance, buyPressure, sellPressure, efficiency },
                                                                                                                                                                                                                                                                                                                                            time: { velocity, acceleration },
                                                                                                                                                                                                                                                                                                                                                structure: { sequence: structure, swings },
                                                                                                                                                                                                                                                                                                                                                    history: { high: hist_high, low: hist_low, range: hist_range, returns, max_drawdown },
                                                                                                                                                                                                                                                                                                                                                        momentum,
                                                                                                                                                                                                                                                                                                                                                            volatility_surface: rollingVol,
                                                                                                                                                                                                                                                                                                                                                                support_resistance: { support, resistance },
                                                                                                                                                                                                                                                                                                                                                                    patterns,
                                                                                                                                                                                                                                                                                                                                                                        behavior,
                                                                                                                                                                                                                                                                                                                                                                            multi_timeframe: mtf,
                                                                                                                                                                                                                                                                                                                                                                                normalized_series: normalized,
                                                                                                                                                                                                                                                                                                                                                                                    entropy,
                                                                                                                                                                                                                                                                                                                                                                                        ai_matrix,
                                                                                                                                                                                                                                                                                                                                                                                            ai_vector
                                                                                                                                                                                                                                                                                                                                                                                              };
                                                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                                              // ROUTE
                                                                                                                                                                                                                                                                                                                                                                                              app.post("/analyze", (req, res) => {
                                                                                                                                                                                                                                                                                                                                                                                                try {
                                                                                                                                                                                                                                                                                                                                                                                                    const result = analyzeMarket(req.body);
                                                                                                                                                                                                                                                                                                                                                                                                        res.json(result);
                                                                                                                                                                                                                                                                                                                                                                                                          } catch (e) {
                                                                                                                                                                                                                                                                                                                                                                                                              res.status(500).json({ error: e.message });
                                                                                                                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                                                                                                                                                // START SERVER
                                                                                                                                                                                                                                                                                                                                                                                                                const PORT = process.env.PORT || 3000;
                                                                                                                                                                                                                                                                                                                                                                                                                app.listen(PORT, "0.0.0.0", () => {
                                                                                                                                                                                                                                                                                                                                                                                                                  console.log("Running...");
                                                                                                                                                                                                                                                                                                                                                                                                                  });