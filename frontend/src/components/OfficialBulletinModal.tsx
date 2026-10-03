import React from 'react';
import { ScheduledBlock, Section } from '../types';
import { X, Printer, Download, ShieldCheck, Train, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  blocks: ScheduledBlock[];
  sections: Section[];
}

export const OfficialBulletinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  blocks,
  sections,
}) => {
  if (!isOpen) return null;

  const sectionMap = React.useMemo(() => {
    const map: Record<string, Section> = {};
    for (const s of sections) map[s.section_id] = s;
    return map;
  }, [sections]);

  const approvedBlocks = blocks.filter((b) => b.status === 'APPROVED');
  const bulletinDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const bulletinNo = `NCR/PRYJ/COA-BLOCK/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Block ID',
      'Section Name',
      'Line',
      'Start Time',
      'End Time',
      'Duration (Mins)',
      'Departments Co-Scheduled',
      'Bundled?',
      'Primary Task',
      'Status',
      'Approved By',
    ];

    const rows = blocks.map((b) => {
      const sec = sectionMap[b.section_id];
      return [
        b.block_id,
        sec?.name || b.section_id,
        sec?.line_type || 'UP_MAIN',
        b.start_time,
        b.end_time,
        b.duration_minutes,
        b.departments.join(' + '),
        b.is_bundled ? 'YES' : 'NO',
        `"${b.tasks[0]?.title || ''}"`,
        b.status,
        b.approved_by || 'PENDING',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IR_BLOCK_BULLETIN_${bulletinDate.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs font-bold px-2 py-0.5 rounded font-mono">
              FORM T/409 (COA)
            </span>
            <span className="text-sm font-bold text-slate-100">
              Official Indian Railways Block Circular Bulletin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              Download CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-sky-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible text-slate-100 print:text-slate-900 bg-slate-900/50 print:bg-white">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-700 print:border-slate-900 pb-5 text-center space-y-1">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400 print:text-slate-600">
              GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS
            </div>
            <div className="text-xl font-extrabold tracking-wide uppercase text-slate-100 print:text-slate-900 font-serif">
              NORTH CENTRAL RAILWAY — PRAYAGRAJ DIVISION
            </div>
            <div className="text-xs font-bold text-sky-400 print:text-slate-700 uppercase tracking-wider">
              CONTROL OFFICE APPLICATION (COA) • AUTOMATIC BLOCK ADVICE CIRCULAR
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 print:text-slate-600 pt-2 px-2">
              <span>Bulletin Ref: <strong className="text-slate-200 print:text-slate-900">{bulletinNo}</strong></span>
              <span>Date: <strong className="text-slate-200 print:text-slate-900">{bulletinDate}</strong></span>
              <span>Corridor: <strong>PRYJ – CNB UP MAIN</strong></span>
            </div>
          </div>

          {/* Addressed To */}
          <div className="text-xs space-y-1 text-slate-300 print:text-slate-800">
            <div><strong>TO:</strong> ALL STATION MASTERS (PRYJ TO CNB) / SECTION CONTROLLERS / SSE (P.WAY) / SSE (OHE/TRD) / SSE (SIGNAL)</div>
            <div><strong>SUBJECT:</strong> Joint Co-Scheduled Maintenance Block Possessions Sanctioned for Date: {bulletinDate}</div>
            <p className="text-[11px] text-slate-400 print:text-slate-600 pt-1">
              Notice is hereby given that the following multi-department corridor blocks have been optimized and authorized by the Central Planning AI and approved by the Divisional Section Controller. Appropriate caution orders, traction power isolations, and traffic diversions must be observed strictly in accordance with General & Subsidiary Rules (G&SR).
            </p>
          </div>

          {/* Table of Approved Blocks */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-700 print:border-slate-900 divide-y divide-slate-700 print:divide-slate-900">
              <thead className="bg-slate-950/80 print:bg-slate-100 text-[10px] uppercase font-bold text-slate-300 print:text-slate-900">
                <tr>
                  <th className="p-2 border-r border-slate-700 print:border-slate-900">Block ID</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-900">Corridor Section</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-900">Time Window</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-900 text-center">Duration</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-900">Departments Co-Scheduled</th>
                  <th className="p-2 border-r border-slate-700 print:border-slate-900">Key Maintenance Work</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-[11px]">
                {blocks.map((b) => {
                  const sec = sectionMap[b.section_id];
                  const isApproved = b.status === 'APPROVED';

                  return (
                    <tr key={b.block_id} className={isApproved ? 'bg-emerald-950/10 print:bg-emerald-50/50' : ''}>
                      <td className="p-2 font-mono font-bold text-sky-400 print:text-slate-900 border-r border-slate-800 print:border-slate-300">
                        {b.block_id.replace('BLK_', '')}
                      </td>
                      <td className="p-2 border-r border-slate-800 print:border-slate-300">
                        <div className="font-semibold text-slate-200 print:text-slate-900">{sec?.name || b.section_id}</div>
                        <div className="text-[10px] text-slate-400 print:text-slate-600 font-mono">Km {sec?.start_km} – {sec?.end_km} ({sec?.traffic_density_gmt} GMT)</div>
                      </td>
                      <td className="p-2 font-mono border-r border-slate-800 print:border-slate-300 text-slate-300 print:text-slate-800 whitespace-nowrap">
                        {b.start_time} <br/> to {b.end_time.split(' ')[1]}
                      </td>
                      <td className="p-2 text-center font-mono font-bold border-r border-slate-800 print:border-slate-300 text-slate-200 print:text-slate-900">
                        {b.duration_minutes}m
                      </td>
                      <td className="p-2 border-r border-slate-800 print:border-slate-300">
                        <div className="flex flex-wrap gap-1">
                          {b.departments.map((d) => (
                            <span key={d} className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-slate-700 print:border-slate-400">
                              {d === 'ENGINEERING' ? 'Track (P.Way)' : d === 'TRD' ? 'OHE (Traction)' : 'Signal (S&T)'}
                            </span>
                          ))}
                        </div>
                        {b.is_bundled && (
                          <div className="text-[10px] font-bold text-sky-400 print:text-blue-800 mt-0.5">
                            ★ Joint Bundled Block ({b.tasks.length} tasks)
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-800 print:border-slate-300 text-slate-300 print:text-slate-800">
                        <ul className="list-disc list-inside space-y-0.5">
                          {b.tasks.map((t) => (
                            <li key={t.task_id} className="text-[10px]">
                              {t.title} {t.speed_restriction ? `(${t.speed_restriction})` : ''}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isApproved ? 'text-emerald-400 print:text-emerald-800 font-extrabold' : 'text-slate-400 print:text-slate-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Operational Instructions */}
          <div className="border border-slate-800 print:border-slate-400 rounded-lg p-3 text-[11px] text-slate-400 print:text-slate-700 space-y-1">
            <div className="font-bold text-slate-200 print:text-slate-900 uppercase">Mandatory Safety Protocols (G&SR 15.06 / Indian Railways):</div>
            <div>1. <strong>Traction Isolation:</strong> TRD Supervisor must ensure 25kV OHE isolation certificate (PTW - Permit To Work) is handed to Engineering supervisor before heavy track plant enters section.</div>
            <div>2. <strong>Speed Restrictions:</strong> Station Master at adjacent block stations must issue Caution Orders to all loco pilots prior to section clearance.</div>
            <div>3. <strong>Burst Block Penalty:</strong> Handover must be strictly completed within the sanctioned window to avoid train detention on the Rajdhani corridor.</div>
          </div>

          {/* Signatures & Authorizations */}
          <div className="grid grid-cols-3 pt-6 text-center text-xs border-t border-slate-800 print:border-slate-400">
            <div>
              <div className="h-10"></div>
              <div className="font-bold text-slate-200 print:text-slate-900">SR. DIVISIONAL OPERATIONS MANAGER</div>
              <div className="text-[10px] text-slate-500">North Central Railway, Prayagraj</div>
            </div>
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-mono text-[10px] text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded bg-emerald-500/10">
                  DIGITALLY VERIFIED (COA AI)
                </span>
              </div>
              <div className="font-bold text-slate-200 print:text-slate-900">CHIEF CONTROLLER (SECTION COA)</div>
              <div className="text-[10px] text-slate-500">Control Office, PRYJ Division</div>
            </div>
            <div>
              <div className="h-10"></div>
              <div className="font-bold text-slate-200 print:text-slate-900">SR. DEN (CO-ORDINATION) / P.WAY</div>
              <div className="text-[10px] text-slate-500">Divisional Railway Manager Office</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
