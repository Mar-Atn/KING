/**
 * Printable Materials Page
 *
 * Generates print-ready participant packages for a simulation run.
 * Each participant gets 4 A4 pages containing:
 * - Page 1: Concise header + Context + Clans Overview
 * - Page 2: Role Details (Avatar + Full Description)
 * - Page 3: Clan Details (Logo + Full Description)
 * - Page 4: Election Process (Sacred Tradition with Timing & Voting Requirements)
 *
 * Uses CSS print styles for proper A4 layout with page breaks.
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface SimulationData {
  run_name: string
  total_participants: number
  vote_1_threshold?: number | null
  vote_2_threshold?: number | null
}

interface ClanData {
  clan_id: string
  name: string
  sequence_number: number
  about?: string
  key_priorities?: string
  attitude_to_others?: string
  if_things_go_wrong?: string
  color_hex?: string
  emblem_url?: string
}

interface RoleData {
  role_id: string
  name: string
  position?: string
  age?: number
  clan_name: string
  clan_id: string
  background?: string
  character_traits?: string
  interests?: string
  avatar_url?: string
}

interface PhaseData {
  name: string
  description: string
  sequence_number: number
  default_duration_minutes?: number
}

export function PrintableMaterials() {
  const { runId } = useParams<{ runId: string }>()
  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [roles, setRoles] = useState<RoleData[]>([])
  const [clans, setClans] = useState<ClanData[]>([])
  const [phases, setPhases] = useState<PhaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSimulationData()
  }, [runId])

  const loadSimulationData = async () => {
    if (!runId) return

    try {
      setLoading(true)
      setError(null)

      // Load simulation basic info
      const { data: simData, error: simError } = await supabase
        .from('sim_runs')
        .select('run_name, total_participants, vote_1_threshold, vote_2_threshold')
        .eq('run_id', runId)
        .single()

      if (simError) throw simError
      setSimulation(simData)

      // Load clans for this simulation
      const { data: clansData, error: clansError } = await supabase
        .from('clans')
        .select('*')
        .eq('run_id', runId)
        .order('sequence_number')

      if (clansError) throw clansError
      setClans(clansData || [])

      // Load roles for this simulation with clan info
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          clan:clans!inner(name)
        `)
        .eq('run_id', runId)
        .order('created_at')

      if (rolesError) throw rolesError

      // Transform roles data to include clan_name
      const transformedRoles = (rolesData || []).map(role => ({
        ...role,
        clan_name: role.clan.name
      }))
      setRoles(transformedRoles)

      // Load phases (all phases for the election process description)
      const { data: phasesData, error: phasesError} = await supabase
        .from('phases')
        .select('name, description, sequence_number, default_duration_minutes')
        .eq('run_id', runId)
        .order('sequence_number')

      if (phasesError) throw phasesError
      setPhases(phasesData || [])

    } catch (err) {
      console.error('Error loading simulation data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load simulation data')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to count roles in each clan
  const getClanSize = (clanId: string) => {
    return roles.filter(r => r.clan_id === clanId).length
  }

  // Calculate votes needed (default 2/3, or custom threshold)
  const getVotesNeeded = (voteNumber: 1 | 2) => {
    const totalVotes = simulation?.total_participants || roles.length
    const defaultThreshold = Math.ceil(totalVotes * 2 / 3) // 2/3 majority

    if (voteNumber === 1) {
      return simulation?.vote_1_threshold || defaultThreshold
    } else {
      return simulation?.vote_2_threshold || defaultThreshold
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading simulation data...</p>
        </div>
      </div>
    )
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Error Loading Data</h2>
          <p className="text-neutral-600 mb-4">{error || 'Simulation not found'}</p>
          <Link to="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const totalVotes = simulation.total_participants || roles.length

  return (
    <>
      {/* Print-only styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 11pt;
          }
          .no-print {
            display: none !important;
          }
          .page {
            page-break-after: always;
            page-break-inside: avoid;
            height: auto;
            min-height: 0;
            max-height: none;
          }
          .page:last-child {
            page-break-after: avoid;
          }
          .page-footer {
            position: relative;
            bottom: auto;
          }
        }

        @media screen {
          body {
            background: #e5e5e5;
            padding: 20px 0;
          }
          .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .participant-package {
            margin-bottom: 40px;
            border: 3px solid #999;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          }
          .page {
            border-bottom: 4px solid #2c5530;
            margin-bottom: 20px;
            box-shadow: inset 0 -10px 20px rgba(44, 85, 48, 0.05);
          }
          .page:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .page::after {
            content: '✂️ CUT HERE ✂️';
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10pt;
            color: #666;
            background: white;
            padding: 2px 12px;
            border-radius: 12px;
            letter-spacing: 2px;
          }
          .page:last-child::after {
            display: none;
          }
        }

        /* Page setup */
        .participant-package {
          width: 210mm;
          margin: 0 auto;
          background: white;
        }

        .page {
          width: 210mm;
          min-height: 270mm;
          padding: 15mm;
          box-sizing: border-box;
          position: relative;
          background: white;
          display: flex;
          flex-direction: column;
        }

        /* Header styles - Concise for Page 1 */
        .compact-header {
          display: flex;
          align-items: center;
          gap: 5mm;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
          border-bottom: 2px solid #2c5530;
        }

        .sim-logo {
          width: 12mm;
          height: 12mm;
          object-fit: contain;
        }

        .sim-title {
          flex: 1;
          font-size: 12pt;
          font-weight: bold;
          color: #2c5530;
        }

        .participant-identity {
          display: flex;
          align-items: center;
          gap: 3mm;
          margin-bottom: 3mm;
          padding: 2mm 3mm;
          background: #f9f9f9;
          border-radius: 4mm;
        }

        .clan-logo-small {
          width: 12mm;
          height: 12mm;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #ddd;
        }

        .avatar-small {
          width: 10mm;
          height: 10mm;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #ddd;
        }

        .participant-info {
          flex: 1;
        }

        .participant-name {
          font-size: 11pt;
          font-weight: bold;
          color: #333;
          margin-bottom: 0.5mm;
        }

        .participant-title {
          font-size: 9pt;
          color: #666;
        }

        .clan-badge {
          font-size: 8.5pt;
          padding: 1.5mm 3mm;
          background: #2c5530;
          color: white;
          border-radius: 3mm;
          font-weight: 600;
        }

        /* Page 2 & 3 Headers */
        .page-title {
          font-size: 13pt;
          font-weight: bold;
          color: #2c5530;
          text-align: center;
          margin-bottom: 4mm;
          padding-bottom: 3mm;
          border-bottom: 2px solid #2c5530;
        }

        .role-header {
          display: flex;
          align-items: center;
          gap: 5mm;
          margin-bottom: 6mm;
          padding: 4mm;
          background: #f9f9f9;
          border-radius: 4mm;
        }

        .avatar-large {
          width: 20mm;
          height: 20mm;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #2c5530;
        }

        .role-info h2 {
          font-size: 14pt;
          font-weight: bold;
          color: #2c5530;
          margin: 0 0 2mm 0;
        }

        .role-meta {
          font-size: 10pt;
          color: #666;
        }

        .clan-header {
          display: flex;
          align-items: center;
          gap: 5mm;
          margin-bottom: 6mm;
          padding: 4mm;
          background: #f9f9f9;
          border-radius: 4mm;
        }

        .clan-logo-large {
          width: 20mm;
          height: 20mm;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #2c5530;
        }

        .clan-header h2 {
          font-size: 14pt;
          font-weight: bold;
          color: #2c5530;
          margin: 0;
        }

        /* Content styles */
        .page-content {
          flex: 1;
          font-family: 'Times New Roman', serif;
          font-size: 9.5pt;
          line-height: 1.35;
          text-align: justify;
        }

        .page-content h2 {
          font-size: 11pt;
          font-weight: bold;
          color: #2c5530;
          margin: 3.5mm 0 2mm 0;
        }

        .page-content h3 {
          font-size: 10pt;
          font-weight: bold;
          color: #2c5530;
          margin: 3mm 0 1.5mm 0;
        }

        .page-content h4 {
          font-size: 9.5pt;
          font-weight: 600;
          color: #2c5530;
          margin: 2mm 0 1mm 0;
        }

        .page-content p {
          margin-bottom: 2mm;
          line-height: 1.35;
        }

        .page-content ul, .page-content ol {
          margin: 1.5mm 0 2.5mm 5mm;
          padding: 0;
        }

        .page-content li {
          margin-bottom: 1mm;
          line-height: 1.3;
        }

        .context-box {
          background: #f0f7f0;
          padding: 3mm;
          border-left: 2mm solid #2c5530;
          margin-bottom: 3mm;
        }

        .clans-list {
          margin-top: 5mm;
        }

        .clans-intro {
          font-size: 11pt;
          font-weight: 600;
          margin-bottom: 3mm;
        }

        .clan-item {
          display: flex;
          justify-content: space-between;
          padding: 2mm 0;
          border-bottom: 1px solid #eee;
        }

        .clan-item:last-child {
          border-bottom: none;
        }

        .process-stage {
          margin-bottom: 2.5mm;
          padding: 2mm;
          background: #f9f9f9;
          border-left: 2mm solid #2c5530;
        }

        .process-stage h3 {
          margin-top: 0;
          margin-bottom: 1mm;
        }

        .process-stage p {
          margin: 0;
        }

        .stage-timing {
          font-size: 9.5pt;
          color: #666;
          font-style: italic;
          margin-bottom: 2mm;
        }

        .voting-requirement {
          background: #fff4e6;
          border: 2px solid #ff9800;
          padding: 4mm;
          margin: 5mm 0;
          border-radius: 3mm;
          text-align: center;
          font-weight: bold;
          font-size: 11pt;
          color: #e65100;
        }

        /* Footer */
        .page-footer {
          position: absolute;
          bottom: 20mm;
          left: 15mm;
          right: 15mm;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3mm;
          padding-top: 2mm;
          border-top: 1px solid #ddd;
          font-size: 8pt;
          color: #888;
        }

        .footer-logo {
          height: 6mm;
          width: auto;
        }

        .footer-text {
          font-size: 8pt;
          color: #888;
        }
      `}} />

      {/* Print Button (screen only) */}
      <div className="no-print">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print All Materials ({roles.length} participants)
        </button>
      </div>

      {/* Generate a package for each role */}
      {roles.map((role) => {
        const clan = clans.find(c => c.clan_id === role.clan_id)
        if (!clan) return null

        return (
          <div key={role.role_id} className="participant-package">
            {/* ===== PAGE 1: Header + Context + Clans Overview ===== */}
            <div className="page">
              {/* Compact Header */}
              <div className="compact-header">
                <img src="/olive.jpg" alt="SIM Logo" className="sim-logo" />
                <div className="sim-title">{simulation.run_name}</div>
              </div>

              {/* Participant Identity */}
              <div className="participant-identity">
                <img src={clan.emblem_url || '/olive.jpg'} alt={clan.name} className="clan-logo-small" />
                <span className="clan-badge">{clan.name}</span>
                <img src={role.avatar_url || '/olive.jpg'} alt={role.name} className="avatar-small" />
                <div className="participant-info">
                  <div className="participant-name">{role.name}</div>
                  {role.position && <div className="participant-title">{role.position}</div>}
                </div>
              </div>

              {/* Context */}
              <div className="page-content">
                <div className="context-box">
                  <h2>Kourion Needs a New KING!</h2>
                  <p>
                    Ancient Cyprus, 5th-4th century BCE. Cyprus is a strategic island crossroads of Greek, Phoenician, and Persian civilizations.
                    Three city-kingdoms (Kourion, Kition, Salamis) are on the brink of conflict. External threats loom from Egyptian, Persian,
                    and Assyrian powers, as well as pirates getting out of control.
                  </p>
                  <p>
                    The mighty city-kingdom of Kourion has lost its King without a heir. You are the noble citizens of Kourion, representing
                    the most noble families belonging to one of the major clans. You gether here today to elect a new supreme ruler, following
                    the ancient sacred tradition.
                  </p>
                  <p>
                    The Kingdom shall not remain without a King. If the King is not elected today - turmoil and unrest might start among
                    ordinary citizens, who can not imagine life without a legitimate King, and enemies will not hesitate to use their chance
                    and take control of our glorious city.
                  </p>

                  <h3>King's main decisions</h3>
                  <p>
                    Once elected the new King will have lifelong powers as supreme ruler of our glorious city. His first order is expected
                    to have these decisions:
                  </p>
                  <ol>
                    <li><strong>Taxes (next year):</strong> the King must decide on taxes for Agriculture, Trade, Banking and Craft, setting
                    each lower, higher or keeping as is.</li>
                    <li><strong>Budget (next year):</strong> the King will set Priority #1, Priority #2 and Priority #3, each one selected
                    out of 6 priorities: defense, culture, agriculture, banking, trade, craft</li>
                    <li><strong>Appointments:</strong> The King will appoint his <em>Economic Advisor</em> and <em>Senior Judge</em></li>
                    <li><strong>International Affairs:</strong> The King can declare New Alliances (with Salamis or Kition) or declare War
                    (Salamis, Kition, Egypt, Assyria, Pirates)</li>
                    <li><strong>Other King's decisions:</strong> as the supreme ruler the King can reward, appoint, arrest, send to exile...</li>
                  </ol>

                  <h3>General Interests</h3>
                  <p>
                    For every noble citizen, becoming the King is the highest honour. Becoming one of the two senior King's Advisors is also
                    a great privilege. Each clan's strongest interest is to promote its candidate to become the new King or, at minimum, one
                    of the two senior King's Advisors. If another clan's representative becomes the King, each clan wants its legitimate clan
                    interests reflected in the King's agenda. There is a high risk for any clan if it falls out of favour with the new King.
                    Once new King is elected each Clan has to take the oath of allegiance to the new King, and also can make final decisions
                    or statements
                  </p>

                  <h3>Strategic Setting</h3>
                  <ul>
                    <li><strong>Key Rivals in Cyprus:</strong> Kition (Phoenician-influenced, trade and wealth oriented, culturally different)
                    and Salamis (strong military, close cultural kinship)</li>
                    <li><strong>Economic Foundations:</strong> Maritime trade; Grain, wine, olive oil production; Strategic Harbors critical
                    for naval defense and commerce.</li>
                  </ul>
                </div>

                {/* Clans Overview */}
                <div className="clans-list">
                  <p>
                    <strong>There are {clans.length} clans in Kourion:</strong> {clans.map((c, idx) => (
                      <span key={c.clan_id}>
                        {c.name} ({getClanSize(c.clan_id)} members){idx < clans.length - 1 ? ', ' : '.'}
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="page-footer">
                <img src="/logo-metagames.png" alt="MetaGames" className="footer-logo" />
                <span className="footer-text">SIM designed by MetaGames Ltd</span>
              </div>
            </div>

            {/* ===== PAGE 2: Role Details ===== */}
            <div className="page">
              <div className="role-header">
                <img src={role.avatar_url || '/olive.jpg'} alt={role.name} className="avatar-large" />
                <div className="role-info">
                  <h2>{role.name}</h2>
                  <div className="role-meta">
                    {role.position && <span>{role.position}</span>}
                    {role.position && role.age && <span> • </span>}
                    {role.age && <span>{role.age} years old</span>}
                  </div>
                </div>
              </div>

              <div className="page-content">
                {role.background && (
                  <>
                    <h3>Background</h3>
                    <p>{role.background}</p>
                  </>
                )}

                {role.character_traits && (
                  <>
                    <h3>Character Traits</h3>
                    {typeof role.character_traits === 'string' ? (
                      <ul>
                        {role.character_traits.split(',').map((trait, idx) => (
                          <li key={idx}>{trait.trim()}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{role.character_traits}</p>
                    )}
                  </>
                )}

                {role.interests && (
                  <>
                    <h3>Interests & Aspirations</h3>
                    <p><em>{role.interests}</em></p>
                  </>
                )}
              </div>

              <div className="page-footer">
                <img src="/logo-metagames.png" alt="MetaGames" className="footer-logo" />
                <span className="footer-text">SIM designed by MetaGames Ltd</span>
              </div>
            </div>

            {/* ===== PAGE 3: Clan Details ===== */}
            <div className="page">
              <div className="clan-header">
                <img src={clan.emblem_url || '/olive.jpg'} alt={clan.name} className="clan-logo-large" />
                <h2>{clan.name}</h2>
              </div>

              <div className="page-content">
                {clan.about && (
                  <>
                    <h3>About This Clan</h3>
                    <p>{clan.about}</p>
                  </>
                )}

                {clan.key_priorities && (
                  <>
                    <h3>Key Priorities</h3>
                    {typeof clan.key_priorities === 'string' ? (
                      <p>{clan.key_priorities}</p>
                    ) : Array.isArray(clan.key_priorities) ? (
                      <ul>
                        {clan.key_priorities.map((priority, idx) => (
                          <li key={idx}>{priority}</li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}

                {clan.attitude_to_others && (
                  <>
                    <h3>Attitude to Other Clans</h3>
                    {typeof clan.attitude_to_others === 'string' ? (
                      <p>{clan.attitude_to_others}</p>
                    ) : typeof clan.attitude_to_others === 'object' ? (
                      <div>
                        {Object.entries(clan.attitude_to_others).map(([clanName, attitude]) => (
                          <p key={clanName}>
                            <strong>{clanName}:</strong> {attitude as string}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}

                {clan.if_things_go_wrong && (
                  <>
                    <h3>If Things Go Wrong</h3>
                    <p>{clan.if_things_go_wrong}</p>
                  </>
                )}
              </div>

              <div className="page-footer">
                <img src="/logo-metagames.png" alt="MetaGames" className="footer-logo" />
                <span className="footer-text">SIM designed by MetaGames Ltd</span>
              </div>
            </div>

            {/* ===== PAGE 4: Election Process ===== */}
            <div className="page">
              <h1 className="page-title">The Sacred Tradition of Electing the King</h1>

              <div className="page-content">
                <p style={{ fontStyle: 'italic', marginBottom: '3mm', fontSize: '10pt' }}>
                  According to the ancient traditions of Kourion, the election of a new King follows a sacred process
                  that ensures wisdom, fairness, and the will of the noble clans.
                </p>

                {phases.slice(1, 13).map((phase, idx) => {
                  const phaseNumber = idx + 1
                  const phaseName = phase.name.toLowerCase()

                  // Detect which vote this is
                  let votingReq = ''
                  if (phaseName.includes('vote')) {
                    let voteNumber: 1 | 2 = 1

                    // Determine if this is Vote 1 or Vote 2
                    if (phaseName.includes('vote 1') || phaseName.includes('first')) {
                      voteNumber = 1
                    } else if (phaseName.includes('vote 2') || phaseName.includes('second')) {
                      voteNumber = 2
                    } else {
                      // Count the vote occurrences before this phase to determine which vote it is
                      const votesBeforeThisOne = phases.slice(1, idx + 1).filter(p =>
                        p.name.toLowerCase().includes('vote') && p.sequence_number < phase.sequence_number
                      ).length
                      voteNumber = votesBeforeThisOne === 0 ? 1 : 2
                    }

                    const votesNeeded = getVotesNeeded(voteNumber)
                    votingReq = ` — ${votesNeeded} votes out of ${totalVotes} needed`
                  }

                  const duration = phase.default_duration_minutes ? ` (${phase.default_duration_minutes} minutes)` : ''

                  return (
                    <div key={phase.sequence_number} className="process-stage">
                      <h3 style={{ marginBottom: '1mm', fontSize: '11pt' }}>
                        Phase {phaseNumber}: {phase.name}{duration}{votingReq}
                      </h3>
                      {phase.description && (
                        <p style={{ marginTop: '1mm', fontSize: '9pt' }}>{phase.description}</p>
                      )}
                    </div>
                  )
                })}

                <p style={{ fontStyle: 'italic', marginTop: '3mm', fontSize: '10pt' }}>
                  Through this time-honored process, the noble citizens of Kourion shall choose their new sovereign.
                </p>
              </div>

              <div className="page-footer">
                <img src="/logo-metagames.png" alt="MetaGames" className="footer-logo" />
                <span className="footer-text">SIM designed by MetaGames Ltd</span>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
