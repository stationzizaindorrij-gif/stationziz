import React from 'react';
import { Fuel, Droplet, Receipt, Package, Settings, Database, CreditCard, Banknote, Wallet } from 'lucide-react';
import { Shift } from '../types';
import { ERPStoreType } from '../store';

interface SharedShiftReportProps {
  shift: Shift;
  store: ERPStoreType;
}

export default function SharedShiftReport({ shift: selectedDetailShift, store }: SharedShiftReportProps) {
  return (
    <>
              {(() => {
                const nonCashTotal = selectedDetailShift.nonCashPayments ? (
                  (selectedDetailShift.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
                  (selectedDetailShift.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
                  (selectedDetailShift.nonCashPayments?.bonCarburantsVivo?.reduce((sum, item) => sum + item.amount, 0) || 0) +
                  (selectedDetailShift.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0) +
                  (selectedDetailShift.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0)
                ) : 0;

                const produitsTotal = selectedDetailShift.productsSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                const servicesTotal = selectedDetailShift.servicesSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                const carburantsTotal = selectedDetailShift.totalAmount || 0;
                const chiffreAffaires = carburantsTotal + produitsTotal + servicesTotal;
                const depensesTotal = selectedDetailShift.expenses?.filter(e => e.method === 'cash').reduce((sum, exp) => sum + exp.amount, 0) || 0;
                const especeARemettre = chiffreAffaires - nonCashTotal - depensesTotal;

                // Calculs Carburants par produit dynamique
                const productAggregates: Record<string, { name: string, liters: number, amount: number }> = {};
                const usedTanks = new Set<string>();
                const nozzleRows: any[] = [];

                if (selectedDetailShift.litersSold) {
                  Object.entries(selectedDetailShift.litersSold).forEach(([nozzleId, liters]) => {
                    if ((liters as number) > 0) {
                      const nozzle = store.nozzles.find(n => n.id === nozzleId);
                      if (nozzle) {
                        usedTanks.add(nozzle.tankId);
                        const product = store.products.find(p => p.id === nozzle.productId);
                        const amount = selectedDetailShift.amountSold?.[nozzleId] || 0;
                        const prodName = product?.name || nozzle.productName || 'Carburant Inconnu';
                        
                        nozzleRows.push({
                          nozzleName: nozzle.name,
                          productName: prodName,
                          startElec: parseFloat(selectedDetailShift.startCounters?.[nozzleId]?.elec as any) || 0,
                          startMech: parseFloat(selectedDetailShift.startCounters?.[nozzleId]?.mech as any) || 0,
                          endElec: parseFloat(selectedDetailShift.endCounters?.[nozzleId]?.elec as any) || 0,
                          endMech: parseFloat(selectedDetailShift.endCounters?.[nozzleId]?.mech as any) || 0,
                          liters,
                          amount,
                          price: (liters as number) > 0 ? (amount / (liters as number)) : 0
                        });

                        if (!productAggregates[prodName]) {
                          productAggregates[prodName] = { name: prodName, liters: 0, amount: 0 };
                        }
                        productAggregates[prodName].liters += (liters as number);
                        productAggregates[prodName].amount += (amount as number);
                      }
                    }
                  });
                }

                return (
                  <div className="space-y-6">
                    {/* EN TÊTE COMPACT */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">Pompiste</div>
                        <div className="font-bold text-slate-800 text-lg uppercase">{selectedDetailShift.attendantName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">Période</div>
                        <div className="font-bold text-slate-800">
                          {new Date(selectedDetailShift.date).toLocaleDateString('fr-FR')} {selectedDetailShift.startTime} &rarr; {selectedDetailShift.endDate && selectedDetailShift.endDate !== selectedDetailShift.date ? new Date(selectedDetailShift.endDate).toLocaleDateString('fr-FR') : ''} {selectedDetailShift.endTime || 'En cours'}
                        </div>
                      </div>
                    </div>

                    {/* RELEVÉ DES INDEX */}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                        Relevé des Index
                      </h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="px-3 py-2 font-medium">Pistolet</th>
                              
                              <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Prix Unitaire</th>
                              <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Début (Elec/Méc)</th>
                              <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Fin (Elec/Méc)</th>
                              <th className="px-3 py-2 font-medium text-right text-slate-900 whitespace-nowrap">Volume (Elec/Méc)</th>
                              <th className="px-3 py-2 font-medium text-right text-slate-900 whitespace-nowrap">Montant (DH)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {nozzleRows.map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-bold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                      <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                    {row.nozzleName}
                                  </div>
                                </td>
                                
                                <td className="px-3 py-2 text-right font-mono text-slate-600 whitespace-nowrap">
                                  {row.price.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-blue-600 whitespace-nowrap">
                                  {row.startElec.toFixed(2)} <span className="text-slate-400 mx-1">/</span> <span className="text-orange-500">{row.startMech.toFixed(0)}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-blue-600 whitespace-nowrap">
                                  {row.endElec.toFixed(2)} <span className="text-slate-400 mx-1">/</span> <span className="text-orange-500">{row.endMech.toFixed(0)}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                                  <span className="text-blue-700">{row.liters.toFixed(2)}</span> <span className="text-slate-400 font-normal mx-1">/</span> <span className="text-orange-600">{(row.endMech - row.startMech).toFixed(2)}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                                  <span className="text-blue-700">{row.amount.toFixed(2)}</span>
                                </td>
                              </tr>
                            ))}
                            {nozzleRows.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-slate-500 italic">Aucune vente de carburant enregistrée</td>
                              </tr>
                            )}
                          </tbody>
                          <thead className="bg-slate-100 border-y border-slate-200 text-slate-600">
                            <tr>
                              <th colSpan={4} className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500"><div className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-blue-500" /> Volumes par Carburant</div></th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Volume (L)</th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Montant (DH)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-slate-50/50">
                            {Object.values(productAggregates).map((prod, idx) => (
                              <tr key={idx}>
                                <td colSpan={4} className="px-3 py-2 font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                      <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    {prod.name}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-700">{prod.liters.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">{prod.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                            {Object.keys(productAggregates).length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-slate-500 italic">Aucun carburant vendu</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">

                      {usedTanks.size > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-slate-500" />
                            Cuves (Consommées)
                          </h4>
                          <div className="rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                  <th className="px-3 py-2 font-medium">Cuve</th>
                                  <th className="px-3 py-2 font-medium">Produit</th>
                                  <th className="px-3 py-2 font-medium text-right">Niveau Actuel (L)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {Array.from(usedTanks).map(tankId => {
                                  const tank = store.tanks.find(t => t.id === tankId);
                                  if (!tank) return null;
                                  return (
                                    <tr key={tank.id}>
                                      <td className="px-3 py-2 font-bold text-slate-800">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <Database className="w-3 h-3 text-slate-500" />
                                          </div>
                                          {tank.number}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                          <Droplet className="w-3 h-3 text-slate-400" />
                                          {tank.productName}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-right font-mono font-bold">{tank.currentLevel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>


                    {/* NON-CASH BREAKDOWN IN REPORT */}
                    {nonCashTotal > 0 && (
                      <>
                        {(() => {
                          const tCarteSntl = selectedDetailShift.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                          const tEspece = selectedDetailShift.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                          const tBonVivo = selectedDetailShift.nonCashPayments?.bonCarburantsVivo?.reduce((sum, item) => sum + item.amount, 0) || 0;
                          const tVignette = selectedDetailShift.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                          const tBonClient = selectedDetailShift.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                          
                          return (
                            <>
                              {(tCarteSntl + tBonVivo + tVignette) > 0 && (
                                <div className="mb-6">
                                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                                    Détail des Encaissements Non Espèce
                                  </h4>
                                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                      <tbody className="divide-y divide-slate-100">
                                        {tCarteSntl > 0 && (
                                          <tr>
                                            <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Carte SNTL</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tCarteSntl.toFixed(2)} DH</td>
                                          </tr>
                                        )}
                                        {tBonVivo > 0 && (
                                          <tr>
                                            <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Bon Carburants Vivo</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tBonVivo.toFixed(2)} DH</td>
                                          </tr>
                                        )}
                                        {tVignette > 0 && (
                                          <tr>
                                            <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Vignette</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tVignette.toFixed(2)} DH</td>
                                          </tr>
                                        )}
                                        <tr>
                                          <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Non Espèce</td>
                                          <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{(tCarteSntl + tBonVivo + tVignette).toFixed(2)} DH</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              
                              {(tEspece + tBonClient) > 0 && (
                                <div>
                                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Banknote className="w-3.5 h-3.5 text-indigo-500" />
                                    Détail des Encaissements Espèce
                                  </h4>
                                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                      <tbody className="divide-y divide-slate-100">
                                        {tEspece > 0 && (
                                          <tr>
                                            <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Espèce (Déclaration)</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tEspece.toFixed(2)} DH</td>
                                          </tr>
                                        )}
                                        {tBonClient > 0 && (
                                          <tr>
                                            <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Bon Client</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tBonClient.toFixed(2)} DH</td>
                                          </tr>
                                        )}
                                        <tr>
                                          <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Espèce</td>
                                          <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{(tEspece + tBonClient).toFixed(2)} DH</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                    {/* DETAILS BOUTIQUE */}
                    {(selectedDetailShift.productsSold?.length || 0) > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-500" />
                          Détails de Boutique
                        </h4>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                              {selectedDetailShift.productsSold?.map(p => (
                                <tr key={p.id}>
                                  <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{p.name}</td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{p.total.toFixed(2)} DH</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Boutique</td>
                                <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{produitsTotal.toFixed(2)} DH</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* DETAILS LAVAGE LA GRAISSE */}
                    {(selectedDetailShift.servicesSold?.length || 0) > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-indigo-500" />
                          Détails de Lavage et Graissage
                        </h4>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                              {selectedDetailShift.servicesSold?.map(s => (
                                <tr key={s.id}>
                                  <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{s.name}</td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{s.total.toFixed(2)} DH</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Lavage et Graissage</td>
                                <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{servicesTotal.toFixed(2)} DH</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* FINANCES COMPACTES */}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-slate-500" />
                        Bilan Financier
                      </h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                          <div className="p-4 flex flex-col">
                            <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                            <div className="font-mono font-bold text-indigo-600 text-lg">+{nonCashTotal.toFixed(2)} DH</div>
                          </div>
                          <div className="p-4 flex flex-col">
                            <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>
                            <div className="font-mono font-bold text-rose-600 text-lg">-{depensesTotal.toFixed(2)} DH</div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
                          <div className="text-sm uppercase text-slate-300 font-black tracking-widest">Total Global</div>
                          <div className="font-mono font-black text-white text-2xl">{(nonCashTotal - depensesTotal).toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                        </div>
                      </div>
                    </div>

                  </div>

                );
              })()}
    </>
  );
}
