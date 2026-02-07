
import { CeeKnowledgeItem } from '../types';

/**
 * Mocking a deep scrape of https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie
 * Now includes landing page content, policy definitions, and sector-specific text.
 */
export const mockScrapeCEE = async (): Promise<CeeKnowledgeItem[]> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return [
    // General Policy Content (Scraped from the top of the page)
    {
      id: 'policy-intro',
      type: 'POLITIQUE',
      title: 'Dispositif des Certificats d’Économies d’Énergie (CEE)',
      versionDate: '2024-01-01',
      url: 'https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie',
      content: 'Le dispositif des CEE constitue l’un des principaux instruments de la politique de maîtrise de la demande d’énergie. Il repose sur une obligation de réalisation d’économies d’énergie imposée par les pouvoirs publics aux vendeurs d’énergie. Les opérations peuvent être standardisées ou spécifiques.'
    },
    {
      id: 'standard-ops-def',
      type: 'POLITIQUE',
      title: 'Les Opérations Standardisées',
      versionDate: '2024-01-01',
      url: 'https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie',
      content: 'Pour faciliter la mise en œuvre du dispositif, des fiches d’opérations standardisées sont définies par arrêtés. Elles sont classées par secteurs (résidentiel, tertiaire, industriel, etc.) et précisent les conditions d’éligibilité et les montants forfaitaires de certificats.'
    },

    // Sector Content
    {
      id: 'sector-res',
      type: 'SECTEUR',
      title: 'Le Secteur Résidentiel (BAR)',
      sector: 'Résidentiel',
      versionDate: '2024-01-01',
      url: 'https://www.ecologie.gouv.fr/fiches-operations-standardisees-secteur-residentiel',
      content: 'Le secteur bâtiment résidentiel regroupe les opérations d’économies d’énergie réalisées dans les maisons individuelles ou les appartements. Les fiches commencent par le préfixe BAR.'
    },

    // Fiche Items (PDF Content)
    {
      id: 'BAR-TH-164-v2',
      type: 'FICHE',
      code: 'BAR-TH-164',
      title: 'Pompe à chaleur de type air/eau',
      sector: 'Résidentiel',
      versionDate: '2024-01-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-TH-164.pdf',
      content: 'Critères d’éligibilité : La pompe à chaleur doit avoir une efficacité énergétique saisonnière supérieure ou égale à 111% pour la basse température.'
    },
    {
      id: 'BAR-TH-164-v1',
      type: 'FICHE',
      code: 'BAR-TH-164',
      title: 'Pompe à chaleur de type air/eau',
      sector: 'Résidentiel',
      versionDate: '2022-04-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-TH-164-old.pdf',
      content: 'Version obsolète. Critères : efficacité saisonnière ≥ 102%.'
    },
    {
      id: 'BAT-TH-116-v1',
      type: 'FICHE',
      code: 'BAT-TH-116',
      title: 'Pompe à chaleur de type air/eau ou eau/eau (Tertiaire)',
      sector: 'Tertiaire',
      versionDate: '2024-03-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/BAT-TH-116.pdf',
      content: 'Puissance thermique nominale de la pompe à chaleur inférieure ou égale à 400 kW.'
    }
  ];
};

/**
 * Filter items based on date and versioning.
 * For FICHE, it takes the latest valid version.
 * For POLITIQUE/SECTEUR, it takes the latest info available before the date.
 */
export const getEffectiveKnowledge = (allItems: CeeKnowledgeItem[], referenceDate: string): CeeKnowledgeItem[] => {
  const ref = new Date(referenceDate).getTime();
  
  // Handle Fiches separately for versioning by code
  const fiches = allItems.filter(i => i.type === 'FICHE');
  const others = allItems.filter(i => i.type !== 'FICHE');

  const groupedFiches = fiches.reduce((acc, op) => {
    if (!op.code) return acc;
    if (!acc[op.code]) acc[op.code] = [];
    acc[op.code].push(op);
    return acc;
  }, {} as Record<string, CeeKnowledgeItem[]>);

  const results: CeeKnowledgeItem[] = [];

  // Add latest versions of fiches
  Object.keys(groupedFiches).forEach(code => {
    const versions = groupedFiches[code]
      .filter(v => new Date(v.versionDate).getTime() <= ref)
      .sort((a, b) => new Date(b.versionDate).getTime() - new Date(a.versionDate).getTime());
    
    if (versions.length > 0) results.push(versions[0]);
  });

  // Add relevant policy/sector info
  others.forEach(item => {
    if (new Date(item.versionDate).getTime() <= ref) {
      results.push(item);
    }
  });

  return results;
};
