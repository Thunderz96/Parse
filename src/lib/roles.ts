export type PlayerRole = 'dps' | 'healer' | 'tank'

const SPEC_ROLE_MAP: Record<string, PlayerRole> = {
  // Tanks
  Blood: 'tank',
  Protection: 'tank',   // Paladin + Warrior both tank
  Guardian: 'tank',
  Brewmaster: 'tank',
  Vengeance: 'tank',
  // Healers
  Holy: 'healer',       // Paladin + Priest both heal
  Discipline: 'healer',
  Restoration: 'healer', // Druid + Shaman both heal
  Mistweaver: 'healer',
  Preservation: 'healer',
}

export function getRole(spec: string): PlayerRole {
  return SPEC_ROLE_MAP[spec] ?? 'dps'
}

export const ROLE_LABELS: Record<PlayerRole, string> = {
  dps: 'DPS',
  healer: 'Healer',
  tank: 'Tank',
}

export const ROLE_COLORS: Record<PlayerRole, string> = {
  dps: 'text-[#ef5350]',
  healer: 'text-[#26a69a]',
  tank: 'text-[#2196f3]',
}

export const ROLE_BG: Record<PlayerRole, string> = {
  dps: 'bg-[#1f0d0d] border-[#ef535033]',
  healer: 'bg-[#0d1f1e] border-[#26a69a33]',
  tank: 'bg-[#0d1525] border-[#2196f333]',
}
