import { getUIText } from '../translations/uiTranslations';

export const premadeSearches = (selectedLanguage) => ({
  sTierShadow: {
    label: getUIText('premade_s_tier_shadows', selectedLanguage),
    description: getUIText('premade_s_tier_shadows_desc', selectedLanguage),
    searchString: '373,409,464,484,150,485,383,483&shadow',
    tier: 'S',
    type: 'Shadow'
  },
  sTierNonShadow: {
    label: getUIText('premade_s_tier_nonshadow', selectedLanguage),
    description: getUIText('premade_s_tier_nonshadow_desc', selectedLanguage),
    searchString: '889,888,646,382,383,384,448,94,719,6,257,890,800',
    tier: 'S',
    type: 'Non-Shadow'
  },
  aPlusTierShadow: {
    label: getUIText('premade_aplus_tier_shadows', selectedLanguage),
    description: getUIText('premade_aplus_tier_shadows_desc', selectedLanguage),
    searchString: '697,248,260,486,243,146,376,473,462,68,382,635,250,526,94,282,445,530,466,149,555,534,609,257&shadow',
    tier: 'A+',
    type: 'Shadow'
  },
  aPlusTierNonShadow: {
    label: getUIText('premade_aplus_tier_nonshadow', selectedLanguage),
    description: getUIText('premade_aplus_tier_nonshadow_desc', selectedLanguage),
    searchString: '644,796,639,464,643,894,384,484,248,260,254,376,310,381,282,445,142,359,460,448,645,798&mega',
    tier: 'A+',
    type: 'Non-Shadow'
  },
  aTierShadow: {
    label: getUIText('premade_a_tier_shadows', selectedLanguage),
    description: getUIText('premade_a_tier_shadows_desc', selectedLanguage),
    searchString: '145,461,738,398,254,381,430,297,487,244,500,142,359&shadow',
    tier: 'A',
    type: 'Shadow'
  },
  aTierNonShadow: {
    label: getUIText('premade_a_tier_nonshadow', selectedLanguage),
    description: getUIText('premade_a_tier_nonshadow_desc', selectedLanguage),
    searchString: '717,637,892,248,642,492,373,895,409,484,150,376,3,18,380,229,214,362,354,181,65,473,792,382,647,635,720,485,383,487,445,905,483,491,534,609,806,998&mega',
    tier: 'A',
    type: 'Non-Shadow'
  },
  top25MasterLeague: {
    label: getUIText('premade_top25_master_league', selectedLanguage),
    description: getUIText('premade_top25_master_league_desc', selectedLanguage),
    searchString: '888,484,889,483,646,644,643,249,376,890,800,792,250,383,381,648,671,468,791',
    tier: 'PvP',
    type: 'Master League'
  },
  counterDragonite: {
    label: getUIText('premade_counter_dragonite', selectedLanguage),
    description: getUIText('premade_counter_dragonite_desc', selectedLanguage),
    searchString: '>flying,>dragon&!<flying,!<dragon',
    tier: 'Type',
    type: 'Type Effectiveness'
  },
  counterRaidBossFlying: {
    label: getUIText('premade_counter_raid_boss_flying', selectedLanguage),
    description: getUIText('premade_counter_raid_boss_flying_desc', selectedLanguage),
    searchString: '>electric,>rock,>ice',
    tier: 'Type',
    type: 'Type Effectiveness'
  },
  tankiestVsFire: {
    label: getUIText('premade_tankiest_vs_fire', selectedLanguage),
    description: getUIText('premade_tankiest_vs_fire_desc', selectedLanguage),
    searchString: '!<fire&!fire',
    tier: 'Type',
    type: 'Type Effectiveness'
  },
  counterMetaDragons: {
    label: getUIText('premade_counter_meta_dragons', selectedLanguage),
    description: getUIText('premade_counter_meta_dragons_desc', selectedLanguage),
    searchString: '>dragon,>ice,>fairy&!<dragon',
    tier: 'Type',
    type: 'Type Effectiveness'
  }
});

