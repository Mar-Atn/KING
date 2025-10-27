/**
 * Edit Scenario Page
 *
 * Allows facilitators to:
 * - Select and review simulation templates
 * - Edit clans (add, modify, delete)
 * - Edit roles (add, modify, delete)
 * - Duplicate templates
 * - Save changes to templates
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { ImageUpload } from '../components/ImageUpload'
import { ClanLogo } from '../components/ClanLogo'
import { Avatar } from '../components/Avatar'

type SimTemplate = Database['public']['Tables']['simulation_templates']['Row']

export function EditScenario() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [templates, setTemplates] = useState<SimTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<SimTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'clans' | 'roles'>('clans')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedClan, setExpandedClan] = useState<string | null>(null)
  const [expandedRole, setExpandedRole] = useState<number | null>(null)
  const [isAddingClan, setIsAddingClan] = useState(false)
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [newClanName, setNewClanName] = useState('')

  // Redirect if not facilitator
  useEffect(() => {
    if (profile && profile.role !== 'facilitator') {
      navigate('/dashboard')
    }
  }, [profile, navigate])

  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('simulation_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicateTemplate = async () => {
    if (!selectedTemplate) return

    if (!confirm(`Duplicate template "${selectedTemplate.name} ${selectedTemplate.version}"?\n\nThis will create a new version for editing.`)) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Create new template with incremented version
      const versionMatch = selectedTemplate.version.match(/v(\d+\.\d+)/)
      const currentVersion = versionMatch ? parseFloat(versionMatch[1]) : 1.0
      const newVersion = `v${(currentVersion + 0.1).toFixed(1)}`

      const newTemplate = {
        name: `Copy of ${selectedTemplate.name}`,
        version: newVersion,
        language: selectedTemplate.language || 'ENG',
        context_text: selectedTemplate.context_text,
        description: selectedTemplate.description,
        decisions_framework: selectedTemplate.decisions_framework,
        canonical_clans: selectedTemplate.canonical_clans,
        canonical_roles: selectedTemplate.canonical_roles,
        process_stages: selectedTemplate.process_stages,
        author: profile?.display_name || profile?.email || 'Unknown',
        is_active: true,
      }

      const { data, error } = await supabase
        .from('simulation_templates')
        .insert([newTemplate])
        .select()
        .single()

      if (error) throw error

      setSuccessMessage(`Template duplicated successfully as ${newVersion}`)
      setSelectedTemplate(data)
      loadTemplates()
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return

    if (!confirm('Save changes to this template?\n\nAll future simulations will use the updated template.')) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('simulation_templates')
        .update({
          canonical_clans: selectedTemplate.canonical_clans,
          canonical_roles: selectedTemplate.canonical_roles,
          process_stages: selectedTemplate.process_stages,
          description: selectedTemplate.description,
          name: selectedTemplate.name,
        })
        .eq('template_id', selectedTemplate.template_id)

      if (error) throw error

      setSuccessMessage('Template saved successfully')
      loadTemplates()
    } catch (err: any) {
      setError(err.message || 'Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  // Clan editing functions
  const updateClan = (clanName: string, updates: any) => {
    if (!selectedTemplate) return

    const clans = selectedTemplate.canonical_clans as any[]
    const updatedClans = clans.map((clan: any) =>
      clan.name === clanName ? { ...clan, ...updates } : clan
    )

    setSelectedTemplate({
      ...selectedTemplate,
      canonical_clans: updatedClans,
    })
  }

  const deleteClan = (clanName: string) => {
    if (!selectedTemplate) return
    if (!confirm(`Delete clan "${clanName}"?\n\nThis will also delete all roles in this clan.`)) {
      return
    }

    const clans = selectedTemplate.canonical_clans as any[]
    const roles = selectedTemplate.canonical_roles as any[]

    const updatedClans = clans.filter((clan: any) => clan.name !== clanName)
    const updatedRoles = roles.filter((role: any) => role.clan !== clanName)

    setSelectedTemplate({
      ...selectedTemplate,
      canonical_clans: updatedClans,
      canonical_roles: updatedRoles,
    })

    setExpandedClan(null)
  }

  const addClan = () => {
    if (!selectedTemplate || !newClanName.trim()) return

    const clans = selectedTemplate.canonical_clans as any[]

    // Check if clan name already exists
    if (clans.some((c: any) => c.name === newClanName.trim())) {
      setError('A clan with this name already exists')
      return
    }

    const maxSequence = clans.length > 0 ? Math.max(...clans.map((c: any) => c.sequence || 0)) : 0

    const newClan = {
      name: newClanName.trim(),
      sequence: maxSequence + 1,
      about: '',
      key_priorities: '',
      attitude_to_others: '',
      if_things_go_wrong: '',
      color_hex: '#8B7355',
    }

    setSelectedTemplate({
      ...selectedTemplate,
      canonical_clans: [...clans, newClan],
    })

    setNewClanName('')
    setIsAddingClan(false)
    setExpandedClan(newClan.name)
  }

  // Role editing functions
  const updateRole = (sequence: number, updates: any) => {
    if (!selectedTemplate) return

    const roles = selectedTemplate.canonical_roles as any[]
    const updatedRoles = roles.map((role: any) =>
      role.sequence === sequence ? { ...role, ...updates } : role
    )

    setSelectedTemplate({
      ...selectedTemplate,
      canonical_roles: updatedRoles,
    })
  }

  const deleteRole = (sequence: number) => {
    if (!selectedTemplate) return

    const role = (selectedTemplate.canonical_roles as any[]).find((r: any) => r.sequence === sequence)
    if (!confirm(`Delete role "${role?.name}"?`)) {
      return
    }

    const roles = selectedTemplate.canonical_roles as any[]
    const updatedRoles = roles.filter((r: any) => r.sequence !== sequence)

    setSelectedTemplate({
      ...selectedTemplate,
      canonical_roles: updatedRoles,
    })

    setExpandedRole(null)
  }

  const addRole = () => {
    if (!selectedTemplate) return

    const roles = selectedTemplate.canonical_roles as any[]
    const clans = selectedTemplate.canonical_clans as any[]

    if (clans.length === 0) {
      setError('Please create at least one clan before adding roles')
      return
    }

    const maxSequence = roles.length > 0 ? Math.max(...roles.map((r: any) => r.sequence)) : 0

    const newRole = {
      sequence: maxSequence + 1,
      name: `New Role ${maxSequence + 1}`,
      age: 30,
      clan: clans[0].name, // Default to first clan
      position: '',
      background: '',
      character_traits: '',
      interests: '',
    }

    setSelectedTemplate({
      ...selectedTemplate,
      canonical_roles: [...roles, newRole],
    })

    setIsAddingRole(false)
    setExpandedRole(newRole.sequence)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-primary hover:text-primary-hover">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="font-heading text-3xl text-primary">Edit Scenario Template</h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Customize clans, roles, and template settings
                </p>
              </div>
            </div>
            {selectedTemplate && (
              <div className="flex gap-3">
                <button
                  onClick={handleDuplicateTemplate}
                  disabled={isSaving}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Duplicate Template
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-success/10 border border-success text-success px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Template Selection */}
        {!selectedTemplate ? (
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-primary">
            <h2 className="font-heading text-2xl text-primary mb-4">Select Template to Edit</h2>
            <p className="text-neutral-600 mb-6">
              Choose a simulation template to customize clans, roles, and settings
            </p>

            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.template_id}
                  onClick={() => setSelectedTemplate(template)}
                  className="w-full p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {template.name} <span className="text-primary">{template.version}</span>
                      </div>
                      <div className="text-sm text-neutral-600 mt-1">
                        {template.description}
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Template Info */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Editable Template Name */}
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                      className="font-heading text-2xl text-primary bg-transparent border-b-2 border-transparent hover:border-primary/30 focus:border-primary focus:outline-none transition-colors flex-1"
                      placeholder="Template name"
                    />
                    <span className="font-heading text-2xl text-primary">{selectedTemplate.version}</span>
                  </div>
                  <input
                    type="text"
                    value={selectedTemplate.description || ''}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                    className="text-neutral-600 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-400 focus:outline-none transition-colors w-full"
                    placeholder="Template description (optional)"
                  />
                  <div className="mt-3 flex items-center gap-4 text-sm text-neutral-600">
                    <span>
                      {(selectedTemplate.canonical_clans as any[])?.length || 0} clans
                    </span>
                    <span>•</span>
                    <span>
                      {(selectedTemplate.canonical_roles as any[])?.length || 0} roles
                    </span>
                    <span>•</span>
                    <span>
                      {(selectedTemplate.process_stages as any[])?.length || 0} phases
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log('Template Data:', {
                      clans: selectedTemplate.canonical_clans,
                      roles: selectedTemplate.canonical_roles,
                    })
                    setSelectedTemplate(null)
                    setSuccessMessage(null)
                    setError(null)
                  }}
                  className="text-neutral-600 hover:text-neutral-900 text-sm underline"
                >
                  Change Template
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md border-l-4 border-primary">
              <div className="border-b border-neutral-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('clans')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'clans'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Clans ({(selectedTemplate.canonical_clans as any[])?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'roles'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Roles ({(selectedTemplate.canonical_roles as any[])?.length || 0})
                  </button>
                </div>
              </div>

              <div className="p-8">
                {activeTab === 'clans' ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading text-xl text-primary">Manage Clans</h3>
                      <button
                        onClick={() => setIsAddingClan(true)}
                        className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-white font-medium rounded-lg transition-colors"
                      >
                        Add New Clan
                      </button>
                    </div>
                    <p className="text-neutral-600 mb-6">
                      Edit clan definitions, priorities, and characteristics. Changes affect the template for all future simulations.
                    </p>

                    {/* Add Clan Form */}
                    {isAddingClan && (
                      <div className="mb-4 p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                        <h4 className="font-medium text-neutral-900 mb-3">Add New Clan</h4>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newClanName}
                            onChange={(e) => setNewClanName(e.target.value)}
                            placeholder="Clan name (e.g., Merchants)"
                            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            onKeyPress={(e) => e.key === 'Enter' && addClan()}
                          />
                          <button
                            onClick={addClan}
                            className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-white font-medium rounded-lg transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingClan(false)
                              setNewClanName('')
                            }}
                            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Clans List */}
                    <div className="space-y-3">
                      {(selectedTemplate.canonical_clans as any[] || []).map((clan: any) => {
                        const isExpanded = expandedClan === clan.name

                        return (
                          <div
                            key={clan.name}
                            className="border rounded-lg border-neutral-200 bg-white"
                          >
                            {/* Clan Header */}
                            <button
                              onClick={() => setExpandedClan(isExpanded ? null : clan.name)}
                              className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <ClanLogo
                                  src={clan.logo_url}
                                  alt={clan.name}
                                  size="sm"
                                  circular
                                />
                                <span className="font-medium text-neutral-900">{clan.name}</span>
                                <span className="text-xs text-neutral-500">
                                  ({(selectedTemplate.canonical_roles as any[]).filter((r: any) => r.clan === clan.name).length} roles)
                                </span>
                              </div>
                              <svg
                                className={`w-5 h-5 text-neutral-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Clan Details (Expanded) */}
                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-4 border-t border-neutral-200">
                                {/* Clan Logo Upload */}
                                <div className="pt-4">
                                  <label className="block text-sm font-medium text-neutral-900 mb-3">
                                    Clan Logo
                                  </label>
                                  <ImageUpload
                                    currentUrl={clan.logo_url}
                                    altText={clan.name}
                                    onUpload={(newUrl) => updateClan(clan.name, { logo_url: newUrl })}
                                    circular={false}
                                    size="md"
                                    fallbackInitials={clan.name.split(' ').filter(w => w.length > 2).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                    label="Upload Logo"
                                  />
                                </div>

                                {/* About */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                                    About
                                  </label>
                                  <textarea
                                    value={clan.about || clan.description || ''}
                                    onChange={(e) => updateClan(clan.name, { about: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="Describe this clan's role, identity, and characteristics..."
                                  />
                                </div>

                                {/* Key Priorities */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                                    Key Priorities
                                  </label>
                                  <textarea
                                    value={clan.key_priorities || ''}
                                    onChange={(e) => updateClan(clan.name, { key_priorities: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="What this clan values most in a King and their policy priorities..."
                                  />
                                </div>

                                {/* Attitude to Others */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                                    Attitude to Other Clans
                                  </label>
                                  <textarea
                                    value={clan.attitude_to_others || ''}
                                    onChange={(e) => updateClan(clan.name, { attitude_to_others: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="How this clan views and interacts with other clans..."
                                  />
                                </div>

                                {/* If Things Go Wrong */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                                    If Things Go Wrong
                                  </label>
                                  <textarea
                                    value={clan.if_things_go_wrong || ''}
                                    onChange={(e) => updateClan(clan.name, { if_things_go_wrong: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="What leverage or actions this clan has if their interests are threatened..."
                                  />
                                </div>

                                {/* Color */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                                    Clan Color
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={clan.color_hex || '#8B7355'}
                                      onChange={(e) => updateClan(clan.name, { color_hex: e.target.value })}
                                      className="w-20 h-10 border border-neutral-300 rounded cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={clan.color_hex || '#8B7355'}
                                      onChange={(e) => updateClan(clan.name, { color_hex: e.target.value })}
                                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                      placeholder="#8B7355"
                                    />
                                  </div>
                                </div>

                                {/* Delete Button */}
                                <div className="pt-3 border-t border-neutral-200">
                                  <button
                                    onClick={() => deleteClan(clan.name)}
                                    className="text-sm text-error hover:text-error/80 font-medium"
                                  >
                                    Delete Clan
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading text-xl text-primary">Manage Roles</h3>
                      <button
                        onClick={addRole}
                        className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-white font-medium rounded-lg transition-colors"
                      >
                        Add New Role
                      </button>
                    </div>
                    <p className="text-neutral-600 mb-6">
                      Edit role definitions, backgrounds, and characteristics. Changes affect the template for all future simulations.
                    </p>

                    {/* Roles List */}
                    <div className="space-y-2">
                      {(selectedTemplate.canonical_roles as any[] || []).map((role: any) => {
                        const isExpanded = expandedRole === role.sequence

                        return (
                          <div
                            key={role.sequence}
                            className="border rounded-lg border-neutral-200 bg-white"
                          >
                            {/* Role Header */}
                            <button
                              onClick={() => setExpandedRole(isExpanded ? null : role.sequence)}
                              className="w-full p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar
                                  src={role.avatar_url}
                                  alt={role.name}
                                  size="sm"
                                />
                                <span className="font-medium text-neutral-900">{role.name}</span>
                                <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded">
                                  {role.clan}
                                </span>
                                {role.position && (
                                  <span className="text-xs text-neutral-500">
                                    {role.position}
                                  </span>
                                )}
                              </div>
                              <svg
                                className={`w-5 h-5 text-neutral-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Role Details (Expanded) */}
                            {isExpanded && (
                              <div className="px-3 pb-3 space-y-3 border-t border-neutral-200">
                                {/* Role Avatar Upload */}
                                <div className="pt-3">
                                  <label className="block text-sm font-medium text-neutral-900 mb-3">
                                    Character Avatar
                                  </label>
                                  <ImageUpload
                                    currentUrl={role.avatar_url}
                                    altText={role.name}
                                    onUpload={(newUrl) => updateRole(role.sequence, { avatar_url: newUrl })}
                                    circular={true}
                                    size="md"
                                    fallbackInitials={role.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                    label="Upload Avatar"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  {/* Name */}
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-900 mb-1">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={role.name}
                                      onChange={(e) => updateRole(role.sequence, { name: e.target.value })}
                                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                  </div>

                                  {/* Age */}
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-900 mb-1">
                                      Age
                                    </label>
                                    <input
                                      type="number"
                                      min="18"
                                      max="80"
                                      value={role.age || 30}
                                      onChange={(e) => {
                                        const age = parseInt(e.target.value)
                                        if (!isNaN(age)) {
                                          updateRole(role.sequence, { age })
                                        }
                                      }}
                                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                  </div>

                                  {/* Clan */}
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-900 mb-1">
                                      Clan
                                    </label>
                                    <select
                                      value={role.clan}
                                      onChange={(e) => updateRole(role.sequence, { clan: e.target.value })}
                                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                      {(selectedTemplate.canonical_clans as any[]).map((clan: any) => (
                                        <option key={clan.name} value={clan.name}>
                                          {clan.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Position */}
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-900 mb-1">
                                      Position/Title
                                    </label>
                                    <input
                                      type="text"
                                      value={role.position || ''}
                                      onChange={(e) => updateRole(role.sequence, { position: e.target.value })}
                                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                      placeholder="e.g., General, Elder, Merchant"
                                    />
                                  </div>
                                </div>

                                {/* Background */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-1">
                                    Background
                                  </label>
                                  <textarea
                                    value={role.background || ''}
                                    onChange={(e) => updateRole(role.sequence, { background: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="Character's backstory, motivations, history, and personality..."
                                  />
                                </div>

                                {/* Character Traits */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-1">
                                    Character Traits
                                  </label>
                                  <textarea
                                    value={role.character_traits || ''}
                                    onChange={(e) => updateRole(role.sequence, { character_traits: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="Personality traits and characteristics (e.g., Brilliant and innovative, Strategic thinker...)"
                                  />
                                </div>

                                {/* Interests */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-900 mb-1">
                                    Interests
                                  </label>
                                  <textarea
                                    value={role.interests || ''}
                                    onChange={(e) => updateRole(role.sequence, { interests: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="What this character cares about, values, and pursues..."
                                  />
                                </div>

                                {/* Delete Button */}
                                <div className="pt-3 border-t border-neutral-200">
                                  <button
                                    onClick={() => deleteRole(role.sequence)}
                                    className="text-sm text-error hover:text-error/80 font-medium"
                                  >
                                    Delete Role
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
